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
import {HttpClient, HttpEventType, HttpHeaders, HttpRequest, HttpResponse} from '@angular/common/http';

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
    maxFileSize = 200;
    acceptedFormats: any = '*';
    fileIsLoading: boolean;
    newFolderInput = new FormControl('', [Validators.required, Validators.maxLength(255)]);
    isCreatingFolder: boolean;
    fileHasUploaded = false;
    fileIsUploading = false;

    constructor(private authService: AuthService,
                private userService: UserService,
                private route: ActivatedRoute,
                private router: Router,
                private title: Title,
                private toastr: ToastrService,
                private httpClient: HttpClient) {
        this.title.setTitle('Home - Edm');

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
        this.fileIsUploading = false;
        this.fileHasUploaded = false;
        document.getElementById('upload-progress-section').style.setProperty('display', 'none');

    }

    getUserFiles(): void {
        this.userService.getUserFiles(this.authUser.id).then(
            (response: any) => {
                this.folder = null;
                const files = response.data.data;
                this.fillUserFiles(files);
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
                this.fillUserFiles(files);
                this.folder = folder;
                this.title.setTitle(folder.name + ' - Edm');
                this.getSectionLabels();
                this.loaded = true;
                console.log(folder);

            }
        );
    }

    fillUserFiles(files: UploadedFile[]): void {
        files.forEach((file: UploadedFile) => {
            file.hasUploaded = true;
            file.pending = false;
            file.isUploading = false;
            file.isUploading = false;
            file.isConfirmed = true;
            file.creation_date_human = moment(file.creation_date).calendar(null, {
                lastDay : '[Yesterday]',
                sameDay : '[Today]',
                nextDay : '[Tomorrow]',
                lastWeek : '[last] dddd',
                nextWeek : 'dddd',
                sameElse : 'L'
            });
        });
        this.files = files;
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

    getPercentageLoaded(batch): number {
        let percentage = 0;
        let totalUploadingImages = 0;

        this.getUploadingFiles(batch).forEach(
            (file: UploadedFile) => {
                if (file.pending) {
                    totalUploadingImages++;
                    percentage += file.percentageLoaded;
                }
            }
        );
        return  totalUploadingImages > 0 ? (percentage / totalUploadingImages) : 0;
    }

    getDisplayUploadingFiles(): UploadedFile[] {
        const batches = [];
        const uploadingFiles: UploadedFile[] = [];

        this.files.forEach(
            (uploadedFile: UploadedFile) => {
                if (!batches.includes(uploadedFile.batch)) {
                    batches.push(uploadedFile.batch);
                }
            }
        );

        batches.forEach(
            (batch: string) => {

                if (this.getUploadingFileAt(batch)) {
                    uploadingFiles.unshift(this.getUploadingFileAt(batch));
                }
            }
        );

        return uploadingFiles;
    }

    getUploadingElements(): UploadedFile[] {
        const uploadingFiles: UploadedFile[] = [];

        this.getDisplayUploadingFiles().forEach(
            (uploadedFile: UploadedFile) => {

                if (uploadedFile.isUploading) {
                    uploadingFiles.push(uploadedFile);
                }
            }
        );

        return uploadingFiles;
    }

    getUploadInfo(): string {
        let uploadedElementsQty = 0;

        if (this.fileIsUploading) {
            uploadedElementsQty = this.getUploadingElements().length;
            return 'Uploading ' + uploadedElementsQty + (uploadedElementsQty > 1 ? ' elements' : 'element');
        }

        if (this.fileHasUploaded) {
            uploadedElementsQty = this.getDisplayUploadingFiles().length;

            return 'Uploaded ' + uploadedElementsQty + (uploadedElementsQty > 1 ? ' elements' : 'element');
        }

        return null;

    }

    uploadFiles(batch, i): void {

        this.files.forEach(
            (file: UploadedFile, j) => {
                console.log(batch, file, i, j);
                console.log(file.batch && Number(file.batch) === batch && file.pending && !file.hasUploaded && i === j);

                if (file.batch && file.batch.toString() == batch.toString() && file.pending && !file.hasUploaded && i === j) {
                    console.log('file', file);
                    file.isUploading = true;
                    const formData = new FormData();
                    formData.append('folder_id', file.folder_id ? file.folder_id.toString() : null);
                    formData.append('is_folder', file.is_folder.toString());
                    formData.append('name', file.name);
                    formData.append('file', file.file);
                    formData.append('folderCode', file.folderCode);
                    formData.append('code', file.code);
                    formData.append('batch', file.batch);
                    formData.append('originalType', file.originalType);
                    formData.append('relativePath', file.webkitRelativePath);

                    this.authService.getHeaders().then(
                        (headers: HttpHeaders) => {
                            const req = new HttpRequest(
                                'POST',
                                this.authService.baseUri + 'users/' + this.authUser.id + '/files',
                                formData, {
                                    headers,
                                    reportProgress: true
                                });

                            this.httpClient.request(req).subscribe(
                                event => {
                                    if (event.type === HttpEventType.UploadProgress) {
                                        file.percentageLoaded = Math.round(100 * event.loaded / event.total);
                                    } else if (event instanceof HttpResponse) {
                                        const uploadedFile: UploadedFile = (event.body as UploadedFile);
                                        file.id = uploadedFile.id;
                                        file.path = uploadedFile.path;
                                        file.link = uploadedFile.link;
                                        file.isUploading = false;
                                        file.hasUploaded = true;
                                        file.hasJustUploaded = true;

                                        i++;
                                        this.uploadFiles(batch, i);
                                    }
                                },
                                error => {
                                    file.hasError = true;
                                    file.percentageLoaded = 0;
                                    file.pending = false;
                                }
                            );
                        }
                    );
                }else {
                    i++;
                    this.uploadFiles(batch, i);
                }
                if (i === this.files.length - 1) {
                    this.authService.post('confirm', {user_id: this.authUser.id, batch}).then(
                        (uploadedFiles: UploadedFile[]) => {
                            uploadedFiles.forEach(
                                (k: UploadedFile) => {
                                    this.files.forEach(
                                        (l: UploadedFile) => {
                                            if (l.code === k.code) {
                                                l.pending = false;
                                                l.id = k.id;
                                                l.creation_date = k.creation_date;
                                                l.created_at = k.updated_at;
                                                l.updated_at = k.created_at;
                                                l.consulted_at = k.consulted_at;
                                                l.isCompleted = true;
                                                l.isConfirmed = true;
                                                this.fileIsUploading = false;
                                                this.fileHasUploaded = true;

                                            }
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            }
        );
    }

    getUploadingFileAt(batch): UploadedFile {
        return this.getUploadingFiles(batch)[0];
    }

    getUploadingFiles(batch): UploadedFile[] {
        const files: UploadedFile[] = [];

        this.files.forEach(
            (file: UploadedFile) => {
                if (file.batch === batch && (file.isUploading || file.pending || file.hasJustUploaded)) {
                    files.push(file);
                }
            }
        );

        return files;
    }

    findOrCreateFolder(folderName: string, batch: string, scale: number): UploadedFile {

        let folder = this.files.find(
            (uploadedFile: UploadedFile) => {
                return uploadedFile.is_folder && uploadedFile.batch === batch && uploadedFile.scale === scale;
            }
        );

        if (folder) {
            return folder;
        }

        folder = {
            isUploading: false,
            hasUploaded: false,
            isDeleting: false,
            percentageLoaded: 0,
            pending: true,
            name: folderName,
            type: 'folder',
            isCompleted: false,
            isConfirmed: false,
            link: null,
            hasError: false,
            hasJustUploaded: false,
            is_folder: false,
            batch,
            file: null,
            code: Date.now().toString(),
            scale,
            folder_id: scale === 0 ? this.folderId : null
        };

        this.files.push(folder);


        return folder;
    }

    createNewFile(file: any, extras: {batch: string, scale: number, folderCode: string}): void {
        const uploadedFile: UploadedFile = {
            isUploading: false,
            hasUploaded: false,
            isDeleting: false,
            percentageLoaded: 0,
            pending: true,
            name: file.name,
            originalType: file.type,
            isCompleted: false,
            isConfirmed: false,
            link: null,
            hasError: false,
            hasJustUploaded: false,
            is_folder: false,
            batch: extras.batch,
            file,
            code: Date.now().toString(),
            scale: extras.scale,
            folderCode: extras.folderCode,
            webkitRelativePath: file.webkitRelativePath
        };

        console.log(uploadedFile);

        this.files.push(uploadedFile);
    }

    detectFile(event): void {
        const files: any = event.target.files;
        const batch = Date.now().toString();
        console.log(files);
        this.checkImages(files).then(
            () => {
                Array.from(files).forEach((file: any, i) => {
                    const currentFilesName: any = file.webkitRelativePath.toString().split('/');
                    const fileExtras = {
                        batch,
                        scale: 0,
                        folderCode: null,
                    };
                    console.log(currentFilesName);

                    currentFilesName.forEach(
                        (currentFile: string, j) => {

                            if (i < currentFilesName.length - 1) {
                                const folder = this.findOrCreateFolder(currentFile, batch, j);

                                console.log(folder);

                                fileExtras.folderCode = folder.code;
                                fileExtras.scale = j + 1;
                            }

                        }
                    );
                    this.createNewFile(file, fileExtras);

                    if (i === files.length - 1) {
                        this.fileIsUploading = true;
                        this.uploadFiles(batch, 0);
                        console.log(this.files);
                    }

                });



            },
            reject => {
                this.rejectFiles(files, reject);
            }
        );
    }

    rejectFiles(files: FileList, reject): void {
        if (files.length > 1) {
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


    open(file: UploadedFile): void {
        if (file.is_folder) {
            this.router.navigate(['/app/folders/' + file.id]);
        }
    }

    isCurrentFolderFile(file: UploadedFile): boolean {
        if (this.folderId) {
            return file.folder_id === this.folderId && file.isConfirmed;
        }
        return !file.folder_id && file.isConfirmed;
    }

    getSectionLabels(): any {
        const labels: any = [];
        this.files.forEach(
            (file: UploadedFile) => {
                if (this.isCurrentFolderFile(file) && !labels.includes(file.creation_date_human)) {
                    labels.push(file.creation_date_human);
                }
            }
        );

        return labels.reverse();
    }

    getFilesAt(creationDateHuman): UploadedFile[] {
        const files: UploadedFile[] = [];
        const folders: UploadedFile[] = [];
        this.files.map(
            (file: UploadedFile) => {
                if (file.creation_date_human === creationDateHuman && this.isCurrentFolderFile(file)) {
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
            default:
                return 'fa fa-file';
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
