import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {UploadedFile} from '../../models/app.model';
import {ToastrService} from 'ngx-toastr';
import {HttpClient, HttpEventType, HttpHeaders, HttpRequest, HttpResponse} from '@angular/common/http';
import {AuthService} from '../../services/auth.service';
import {FormControl} from '@angular/forms';

@Component({
    selector: 'app-upload-files',
    templateUrl: './upload-files.component.html',
    styleUrls: ['./upload-files.component.css']
})
export class UploadFilesComponent implements OnInit {
    @Input() uploadUrl: string;
    @Input() deleteUrl: string;
    @Input() uploadName: string;
    @Input() preview: boolean;
    @Input() multiple = 'multiple';
    @Input() title: string;
    @Input() class = 'col-12';
    @Input() progressBarStyle = {height: '20px', 'min-width': '300px', width: '95%'};
    @Input() imageStyle = {width: '100%'};
    @Input() UploadedFiles: UploadedFile[] = [];
    @Input() highlightedImage: UploadedFile;
    @Input() formData: { key: string, value: any }[] = [];
    @Input() previewPlaceHolder = 'assets/img/bg-pattern-topo.png';
    @Input() showFileInput = false;
    @Input() fileHasUploaded: boolean;
    @Input() acceptedFormats: any = ['image/jpeg', 'image/jpg', 'image/png'];
    @Input() maxFileSize = 5;
    @Input() fileIsUploading: boolean;
    @Input() uploadMode = true;
    @Input() isSingleImageUpload = false;

    @Output() UploadedFilesChange = new EventEmitter<UploadedFile[]>();
    @Output() highlightedImageChange = new EventEmitter<UploadedFile>();
    @Output() fileIsUploadingChange = new EventEmitter<boolean>();

    fileIsLoading: boolean;
    newFolderInput = new FormControl();
    submittedFolderForm = false;

    constructor(private toastr: ToastrService, private httpClient: HttpClient, private authService: AuthService) {

    }

    ngOnInit(): void {
        if (this.isSingleImageUpload) {
            this.uploadUrl = 'images/upload';
            this.deleteUrl = 'images/remove';
        }

        this.uploadName = 'file';
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

    createFolder() {
        this.submittedFolderForm = true;
    }

    onDeleteImage(event, imageId, imageIndexToRemove): void {
        event.stopPropagation();

        if (!this.uploadMode) {
            this.highlightedImage = null;
            this.highlightedImageChange.emit(this.highlightedImage);
            return;
        }

        if (this.UploadedFiles[imageIndexToRemove]) {
            this.UploadedFiles[imageIndexToRemove].isDeleting = true;
        }

        const formData: FormData = this.retrieveFormData();

        if (!this.isSingleImageUpload) {
            formData.append('_method', 'DELETE');
        }

        let deleteUrl = this.deleteUrl + '/' + imageId;

        if (this.isSingleImageUpload && this.highlightedImage) {
            this.highlightedImage.isDeleting = true;
            deleteUrl = this.deleteUrl;
        }

        this.authService.post(deleteUrl, formData).then(
            (response: any) => {
                this.UploadedFiles.splice(imageIndexToRemove, 1);
                if (this.highlightedImage && this.highlightedImage.id === imageId && this.UploadedFiles.length > 0) {
                    this.highlightedImage = this.UploadedFiles[0];
                    this.highlightedImageChange.emit(this.highlightedImage);
                }
                if (this.UploadedFiles.length === 0) {
                    this.highlightedImage = null;
                    this.highlightedImageChange.emit(this.highlightedImage);
                }
                this.UploadedFilesChange.emit(this.UploadedFiles);
                if (this.UploadedFiles[imageIndexToRemove]) {
                    this.UploadedFiles[imageIndexToRemove].isDeleting = false;
                }

                if (this.isSingleImageUpload && this.highlightedImage) {
                    this.highlightedImage.isDeleting = false;
                }
            },
            () => {

                if (this.UploadedFiles[imageIndexToRemove]) {
                    this.UploadedFiles[imageIndexToRemove].isDeleting = false;
                }
                if (this.isSingleImageUpload && this.highlightedImage) {
                    this.highlightedImage.isDeleting = false;
                }
            }
        );
    }

    retrieveFormData(): FormData {
        const formData = new FormData();
        if (this.formData.length > 0) {
            this.formData.forEach(
                data => {
                    formData.append(data.key, data.value);
                }
            );
        }
        return formData;
    }

    uploadFile(uploadedFile: UploadedFile, i): void {
        if (!uploadedFile.hasUploaded) {
            const formData: FormData = this.retrieveFormData();
            formData.append(this.uploadName, uploadedFile.file);
            uploadedFile.isUploading = true;
            this.authService.getHeaders().then(
                (headers: HttpHeaders) => {
                    const req = new HttpRequest(
                        'POST',
                        this.authService.baseUri + this.uploadUrl,
                        formData, {
                            headers,
                            reportProgress: true
                        });
                    this.httpClient.request(req).subscribe(
                        event => {
                            if (event.type === HttpEventType.UploadProgress) {
                                uploadedFile.percentageLoaded = Math.round(100 * event.loaded / event.total);
                            } else if (event instanceof HttpResponse) {
                                const file: UploadedFile = (event.body as UploadedFile);
                                uploadedFile.id = file.id;
                                uploadedFile.link = file.url;
                                uploadedFile.isUploading = false;
                                uploadedFile.hasUploaded = true;
                                uploadedFile.hasJustUploaded = true;
                                this.fileHasUploaded = true;
                                if (!this.highlightedImage) {
                                    this.highlightedImage = uploadedFile;
                                    this.highlightedImageChange.emit(this.highlightedImage);
                                }
                                if (i === this.UploadedFiles.length - 1) {
                                    this.fileIsUploading = false;
                                    this.fileIsUploadingChange.emit(false);
                                    if (!this.showFileInput || this.multiple === 'multiple') {
                                        this.UploadedFiles.forEach(
                                            (uploadedF: UploadedFile) => {
                                                uploadedF.pending = false;
                                            }
                                        );
                                    }
                                    this.UploadedFilesChange.emit(this.UploadedFiles);
                                }
                            }
                        },
                        error => {
                            this.fileIsUploading = false;
                            this.fileIsUploadingChange.emit(false);
                            uploadedFile.hasError = true;
                            uploadedFile.percentageLoaded = 0;
                            uploadedFile.pending = true;
                            this.UploadedFilesChange.emit(this.UploadedFiles);
                        }
                    );
                },
            );
        }
    }

    getPercentageLoaded(): number {
        let percentageLoaded = 0;
        let totalUploadingImages = 0;
        if (this.UploadedFiles.length > 0) {
            this.UploadedFiles.map(
                file => {
                    if (!this.fileIsLoading && file.pending) {
                        totalUploadingImages++;
                        percentageLoaded += file.percentageLoaded;
                    }
                }
            );
            return  totalUploadingImages > 0 ? (percentageLoaded / totalUploadingImages) : 0;
        }
    }

    detectFile(event): void {
        const images: FileList = event.target.files;
        this.checkImages(images).then(
            () => {
                this.fileIsLoading = true;
                if (this.multiple !== 'multiple') {
                    this.UploadedFiles = [];
                }
                let currentFilesLength: number = event.target.files.length;
                if (this.UploadedFiles && this.UploadedFiles.length > 0) {
                    currentFilesLength += this.UploadedFiles.length;
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
                        this.toastr.error('La sélection contient un ou plusieurs fichiers non pris en charge');
                    }
                    if (reject === 'size') {
                        this.toastr.error('La taille d\'un ou de plusieurs fichiers sélecionnés est supérieur à ' +
                            this.maxFileSize + 'mégas');
                    }
                } else {
                    if (reject === 'type') {
                        this.toastr.error('Format du fichier non pris en charge.');
                    }
                    if (reject === 'size') {
                        this.toastr.error('La taille de l\'image ne doit pas dépasser ' + this.maxFileSize + ' mégas');
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
}
