import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {AuthUser} from '../../models/auth-user.model';
import {Subscription} from 'rxjs';
import {UserService} from '../../services/user.service';
import * as moment from 'moment';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {UploadedFile} from '../../models/app.model';
import {ToastrService} from 'ngx-toastr';
import {FormControl, Validators} from '@angular/forms';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy{
    authUser: AuthUser;
    userSubscription: Subscription;
    files: UploadedFile[] = [];
    loaded: boolean;
    folderId: number = null;
    folder: UploadedFile;
    submittedFolderForm: boolean;
    maxFileSize = 2000;
    acceptedFormats: any = '*';
    fileIsLoading: boolean;
    newFolderInput = new FormControl('', [Validators.required, Validators.maxLength(255)]);
    isCreatingFolder: boolean;

    constructor(private authService: AuthService,
                private userService: UserService,
                private route: ActivatedRoute,
                private router: Router,
                private title: Title,
                private toastr: ToastrService) {
        this.title.setTitle('Acceuil - Edm');

    }

    ngOnInit(): void {
        this.userSubscription = this.authService.userSubject.subscribe(
            (authUser: AuthUser) => {
                this.authUser = authUser;

                if (authUser) {
                    this.route.params.subscribe(
                        (params: Params) => {
                            if (params.hasOwnProperty('id')) {
                                this.loaded = false;
                                this.folderId = Number(params.id);
                            }
                            if (this.folderId) {
                                this.getUserFolder();
                            } else {
                                this.getUserFiles();
                            }
                        }
                    );
                }
            }
        );

        this.authService.emitUser();
    }

    isUploadProgressOpen(): boolean {
        return document.getElementById('upload-progress').classList.contains('show');
    }

    toggleUploadProgress(): void {
        document.getElementById('upload-progress').classList.toggle('show');
    }

    closeUploadProgressSection(): void {
        document.getElementById('upload-progress-section').style.setProperty('display', 'none');
    }

    createFolder(): void {
        this.submittedFolderForm = true;

        if (this.newFolderInput.invalid) {
            console.log(this.newFolderInput.errors);
            return;
        }

        this.isCreatingFolder = true;
        const params = {
            folder_id: this.folderId,
            name: this.newFolderInput.value
        };

        this.userService.createUserFolder(this.authUser.id, params).then(
            (folder: UploadedFile) => {
                this.isCreatingFolder = false;
                folder.hasUploaded = true;
                this.files.push(folder);
                this.closeModal('modalNewFolder');
            },

            () => {
                this.isCreatingFolder = false;
                this.toastr.error('Sorry an error occurred. Try again later.');
            }
        );
    }

    closeModal(id): void {
        const modal = document.getElementById(id);
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('style', 'display: none');

        const modalsBackdrops = document.getElementsByClassName('modal-backdrop');
        for (let i = 0; i < modalsBackdrops.length; i++) {
            document.body.removeChild(modalsBackdrops[i]);
        }
    }

    detectFile(event, isFolder = false): void {
        console.log(event);
        const images: FileList = event.target.files;
        console.log(images);
        return;
        this.checkImages(images).then(
            () => {
                this.fileIsLoading = true;
                let currentFilesLength: number = event.target.files.length;
                if (this.files && this.files.length > 0) {
                    currentFilesLength += this.files.length;
                }
                Array.from(images).forEach((file) => {
                    const uploadedFile: UploadedFile = {
                        uploadName: this.uploadName,
                        isUploading: false,
                        hasUploaded: !this.uploadMode,
                        isDeleting: false,
                        percentageLoaded: 0,
                        pending: true,
                        link: 'assets/img/bg-pattern-topo.png',
                        file
                    };
                    const reader = new FileReader();
                    reader.onload = () => {
                        uploadedFile.link = reader.result;
                    };
                    reader.readAsDataURL(file);

                    if (this.isSingleImageUpload) {
                        this.highlightedImage = uploadedFile;
                        this.highlightedImageChange.emit(this.highlightedImage);
                    }

                    this.UploadedFiles.push(uploadedFile);

                    if (this.UploadedFiles.length === currentFilesLength) {
                        this.fileIsLoading = false;

                        if (this.isSingleImageUpload && this.uploadMode) {
                            this.uploadFile(this.highlightedImage, 0);
                        }

                        if (!this.isSingleImageUpload  && this.uploadMode) {
                            this.fileIsUploading = true;
                            this.fileIsUploadingChange.emit(this.fileIsUploading);
                            this.UploadedFiles.forEach(
                                (uploadedF: UploadedFile, index) => {
                                    this.uploadFile(uploadedF, index);
                                }
                            );
                        }
                    }
                });
            },
            reject => {
                if (images.length > 1) {
                    if (reject === 'type') {
                        this.toastr.error('The selection contains one or more unsupported files');
                    }
                    if (reject === 'size') {
                        this.toastr.error('The size of one or more selected files is greater than ' +
                            this.maxFileSize / 1000000 + 'gigabytes');
                    }
                } else {
                    if (reject === 'type') {
                        this.toastr.error('File format not supported.');
                    }
                    if (reject === 'size') {
                        this.toastr.error('File size should not exceed ' + this.maxFileSize / 1000000 + ' gigabytes');
                    }
                }
            }
        );
    }

    checkImages(images: FileList): any {
        return new Promise(
            (resolve, reject) => {
                Array.from(images).forEach(file => {
                    if (!this.checkImageType(file)) {
                        reject('type');
                    }
                    if (!this.checkImageSize(file)) {
                        reject('size');
                    }
                });
                resolve();
            }
        );
    }

    checkImageType(image: File): boolean {
        if (this.acceptedFormats === '*') {
            return true;
        }
        const fileFormatCheck = this.acceptedFormats.find(
            acceptedFormat => {
                return image.type === acceptedFormat;
            }
        );
        if (fileFormatCheck) {
            return true;
        }
        if (!fileFormatCheck) {
            return false;
        }
    }

    checkImageSize(image: File): boolean {
        return image.size <= this.maxFileSize * 1000000;
    }


    getUserFiles(): void {
        this.userService.getUserFiles(this.authUser.id).then(
            (response: any) => {
                this.folder = null;
                const files = response.data.data;

                files.forEach((file: UploadedFile) => {
                    file.hasUploaded = true;
                });
                this.files = files;

                this.getSectionLabels();

                this.loaded = true;
                console.log(response);

            }
        );
    }

    getUserFolder(): void {
        this.userService.getUserFolder(this.authUser.id, this.folderId).then(
            (folder: UploadedFile) => {
                const files = folder.files.slice();
                files.forEach((file: UploadedFile) => {
                    file.hasUploaded = true;
                });

                this.folder = folder;
                this.files = files;
                this.title.setTitle(folder.name + ' - Edm');
                this.getSectionLabels();

                this.loaded = true;
                console.log(folder);

            }
        );
    }

    open(file: UploadedFile): void {
        if (file.is_folder) {
            this.router.navigate(['/app/folders/' + file.id]);
        }
    }

    getSectionLabels(): any {
        const labels: any = [];
        this.files.forEach(
            (file: UploadedFile) => {
                if (file.hasUploaded && !labels.includes(file.creation_date_human)) {
                    labels.push(file.creation_date_human);
                }
            }
        );

        return labels;
    }

    getFilesAt(creationDateHuman): UploadedFile[] {
        const files: UploadedFile[] = [];
        const folders: UploadedFile[] = [];
        this.files.map(
            (file: UploadedFile) => {
                if (file.creation_date_human === creationDateHuman && file.hasUploaded) {
                    if (file.is_folder) {
                        folders.push(file);
                    } else {
                        files.push(file);
                    }
                }
            }
        );
        folders.sort((a, b) => (a.name < b.name ? -1 : 1));
        files.sort((a, b) => (a.name < b.name ? -1 : 1));

        folders.reverse().forEach(
            (folder: UploadedFile) => {
                files.unshift(folder);
            }
        );

        return files;
    }

    getFileIconClass(file: any): string {
        switch (file.type) {
            case 'pdf':
                return 'fa fa-file-pdf-o';
            case 'png':
                return 'fa fa-file-image-o';

            case 'xlsx':
                return 'fa fa-file-excel-o';
            case 'docx':
                return 'fa fa-file-word-o';
            case 'folder':
                return 'fa fa-folder-o';
        }
    }


    getCreatedAtHuman(file: UploadedFile): string {
        return moment(file.created_at).fromNow();
    }

    ngOnDestroy(): void {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

}
