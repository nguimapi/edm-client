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
  renameFileInput = new FormControl('', [Validators.required, Validators.maxLength(255)]);
  isCreatingFolder: boolean;
  fileHasUploaded = false;
  fileIsUploading = false;
  fileIsFinalizing = false;
  error: any;
  highlightedFile: UploadedFile;
  submittedRenameForm: boolean;
  isUpdatingFIle: boolean;

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
              } else {
                this.folderId = null;
                this.folder = null;
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
        const files = response.data ?  response.data.data : [];
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
        this.folder.code = this.makeId(13);
        this.folder.batch = this.makeId(13);
        this.folder.scale = -1;
        this.files.push(folder);
        this.title.setTitle(folder.name + ' - Edm');
        this.getSectionLabels();
        this.loaded = true;
        console.log(folder);
      },

      () => {
        this.router.navigateByUrl('not-found', {skipLocationChange: true});
      }
    );
  }

  getCreationDateHuman(creationDate: string): string {

    return moment(creationDate).calendar(null, {
      lastDay : '[Yesterday]',
      sameDay : '[Today]',
      nextDay : '[Tomorrow]',
      lastWeek : '[last] dddd',
      nextWeek : 'dddd',
      sameElse : 'L'
    });
  }

  fillUserFiles(files: UploadedFile[]): void {
    files.forEach((file: UploadedFile) => {
      file.hasUploaded = 1;
      file.pending = 0;
      file.isUploading = 0;
      file.is_confirmed = 1;
      file.scale = -1;
      file.code = this.makeId(13);
      file.batch = this.makeId(13);
      file.creation_date_human = this.getCreationDateHuman(file.creation_date);
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
        folder.creation_date_human = this.getCreationDateHuman(folder.creation_date);
        this.isCreatingFolder = false;
        folder.hasUploaded = 1;
        this.files.push(folder);
        this.closeModal('modalNewFolder');

        this.newFolderInput.setValue('');
        this.error = null;
      },

      (error: any) => {
        console.log(error);

        if (error.error.data && error.error.data.message) {
          this.error = error.error.data;
        }
        this.isCreatingFolder = false;
        this.toastr.error('Sorry an error occurred. Try again later.');
      }
    );
  }
  updateFile(file: UploadedFile, data: any = {}): void {

    if (!file.is_folder) {
      this.submittedRenameForm = true;

      if (this.renameFileInput.invalid) {
        return;
      }
      this.isUpdatingFIle = true;

      this.userService.updateUserFile(this.authUser.id, file.id, data).then(
        (uploadedFile: UploadedFile) => {

          this.files.forEach(
            (f: UploadedFile) => {
              if (f.id === uploadedFile.id) {
                f.name = uploadedFile.name;
                f.is_archived = uploadedFile.is_archived;
                f.is_trashed = uploadedFile.is_trashed;
              }
            }
          );

          this.closeModal('modalRenameFile');

          this.renameFileInput.setValue('');
          this.isUpdatingFIle = false;
          this.highlightedFile = null;

          this.error = null;
        },

        (error: any) => {
          console.log(error);

          if (error.error.data && error.error.data.message) {
            this.error = error.error.data;
          }
          this.isUpdatingFIle = false;
          this.toastr.error('Sorry an error occurred. Try again later.');
        }
      );

    }


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

  getTotalUploadingFiles(batch): number {
    return this.getTotalFilesAt(batch) + this.getTotalFoldersAt(batch);
  }

  getPercentageLoaded(batch): number {
    let percentage = 0;

    this.files.forEach(
      (file: UploadedFile) => {
        if (file.pending === 1 && file.batch === batch) {
          console.log(file.name, file.percentageLoaded);
          percentage += file.percentageLoaded;
        }
      }
    );
    console.log(percentage);
    console.log(this.getTotalUploadingFiles(batch));
    return this.getTotalUploadingFiles(batch) > 0 ? (percentage / this.getTotalUploadingFiles(batch)) : 0;
  }

  getDisplayUploadingFiles(): UploadedFile[] {
    const batches = [];
    const uploadingFiles: UploadedFile[] = [];

    this.files.forEach(
      (uploadedFile: UploadedFile) => {
        if ((uploadedFile.pending || uploadedFile.hasJustUploaded) && !batches.includes(uploadedFile.batch)) {
          batches.push(uploadedFile.batch);
          uploadingFiles.unshift(uploadedFile);
        }
      }
    );

    return uploadingFiles;
  }

  getTotalUploadedFiledAt(batch): number {
    let total = 0;

    this.files.forEach(
      (file: UploadedFile) => {
        if (file.batch === batch && file.hasJustUploaded) {
          total++;
        }
      }
    );
    return total;
  }

  getTotalFilesAt(batch): number {
    let total = 0;

    this.files.forEach(
      (file: UploadedFile) => {
        if (file.batch === batch) {
          total++;
        }
      }
    );
    return total;
  }

  getTotalFoldersAt(batch): number {
    let total = 0;

    this.files.forEach(
      (file: UploadedFile) => {
        if (file.is_folder && file.batch === batch) {
          total++;
        }
      }
    );
    return total;
  }

  getUploadingElements(): UploadedFile[] {
    const uploadingFiles: UploadedFile[] = [];

    this.files.forEach(
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

    const hasError = !!this.getDisplayUploadingFiles().find(
      (file: UploadedFile) => {
        return file.hasError;
      }
    );

    if (this.fileIsFinalizing) {
      return 'Finalizing ' + uploadedElementsQty + (uploadedElementsQty > 1 ? ' elements...' : ' element...');
    }

    if (hasError) {
      let qty = 0;
      this.getDisplayUploadingFiles().map(
        (file: UploadedFile) => {

          if (file.hasError) {
            qty++;
          }
          return file.hasError;
        }
      );

      return 'Failed to upload ' + qty + (qty > 1 ? ' elements' : ' element');
    }


    if (this.fileIsUploading) {
      uploadedElementsQty = this.getUploadingElements().length;
      return 'Uploading ' + uploadedElementsQty + (uploadedElementsQty > 1 ? ' elements...' : ' element...');
    }

    if (this.fileHasUploaded) {
      uploadedElementsQty = this.getDisplayUploadingFiles().length;
      return 'Uploaded ' + uploadedElementsQty + (uploadedElementsQty > 1 ? ' elements' : ' element');
    }

    return null;

  }

  getNextPendingFile(): UploadedFile {
    return this.files.find(
      (file: UploadedFile) => {
        return !file.isUploading && file.pending && !file.hasUploaded && !file.hasError;
      }
    );
  }

  findFileFolder(file: UploadedFile): UploadedFile {
    const files = this.files.slice();
    return files.reverse().find(
      (uploadedFile: UploadedFile) => {
        return uploadedFile.is_folder && uploadedFile.code === file.folderCode;
      }
    );
  }


  uploadFiles(file: UploadedFile): void {
    file.isUploading = 1;
    const formData = new FormData();
    let folderId = this.folderId;

    console.log(file);
    if (file.folderCode) {
      folderId = this.findFileFolder(file).id;
    }

    if (folderId) {
      formData.append('folder_id', folderId.toString());
      file.folder_id = Number(folderId);
    }

    formData.append('is_folder', file.is_folder.toString());
    formData.append('name', file.name);
    formData.append('code', file.code);
    formData.append('batch', file.batch);

    if (file.folderCode) {
      formData.append('folderCode', file.folderCode);
    }

    if (!file.is_folder) {
      formData.append('file', file.file);
      formData.append('original_type', file.originalType);
      formData.append('relativePath', file.webkitRelativePath);
    }


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
              file.creation_date = uploadedFile.creation_date;
              file.creation_date_human = this.getCreationDateHuman(uploadedFile.creation_date);
              file.created_at = uploadedFile.updated_at;
              file.updated_at = uploadedFile.created_at;
              file.display_size = uploadedFile.display_size;
              file.size = uploadedFile.size;
              file.consulted_at = uploadedFile.consulted_at;
              file.type = uploadedFile.type;
              file.isUploading = 0;
              file.hasUploaded = 1;
              file.hasJustUploaded = 1;

              if (this.getNextPendingFile()) {
                this.uploadFiles(this.getNextPendingFile());
              } else {
                const displayedFilesQty = this.getDisplayUploadingFiles().length - 1;

                console.log(displayedFilesQty);

                this.getDisplayUploadingFiles().forEach(
                  (displayedFile: UploadedFile, i) => {

                    if (displayedFile.hasUploaded && displayedFile.pending) {
                      this.fileIsFinalizing = true;
                      this.authService.post('confirm', {user_id: this.authUser.id, batch: displayedFile.batch}).then(
                        (response) => {
                          this.files.forEach(
                            (l: UploadedFile) => {
                              if (l.batch === displayedFile.batch) {
                                l.pending = 0;
                                l.isCompleted = 1;
                                l.is_confirmed = 1;
                                l.hasJustUploaded = 1;
                                this.fileIsUploading = false;
                                this.fileHasUploaded = true;
                              }
                              if (i === displayedFilesQty) {
                                this.fileIsUploading = false;
                                this.fileHasUploaded = true;
                                this.fileIsFinalizing = false;
                              }

                            }
                          );
                        }
                      );
                    }
                  }
                );
              }

            }
          },
          error => {
            file.hasError = 1;
            file.percentageLoaded = 0;
            file.hasUploaded = 0;
            file.isUploading = 0;
            if (this.getNextPendingFile()) {
              this.uploadFiles(this.getNextPendingFile());
            } else {
              this.fileIsUploading = false;
              this.fileHasUploaded = true;
            }
          }
        );
      }
    );
  }

  createNewFolder(folderName: string, parent: UploadedFile, scale: number, batch: string): UploadedFile {

    return  {
      isUploading: 0,
      hasUploaded: 0,
      isDeleting: 0,
      percentageLoaded: 0,
      pending: 1,
      name: folderName,
      type: 'folder',
      isCompleted: 0,
      is_confirmed: 0,
      link: null,
      hasError: 0,
      hasJustUploaded: 0,
      is_folder: 1,
      batch,
      file: null,
      code: this.makeId(13),
      scale,
      folderCode: parent ? parent.code : null
    };

  }

  findOrCreateFolder(folderName: string, parent: UploadedFile, scale: number, batch: string): UploadedFile {

    let folder: UploadedFile = this.files.find( (uploadedFile: UploadedFile) => {
        return  uploadedFile.is_folder && uploadedFile.batch === batch &&
          uploadedFile.scale === scale && uploadedFile.name === folderName;
      }
    );

    if (folder) {
      return folder;
    }

    folder = this.createNewFolder(folderName, parent, scale, batch);
    this.files.push(folder);

    return folder;
  }

  makeId(length): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }


  getFolder(file: any, batch: string, folder: UploadedFile): any {

    return new Promise<UploadedFile>(
      (resolve, reject) => {
        const currentFilesName: any = file.webkitRelativePath.toString().split('/');
        currentFilesName.pop();
        currentFilesName.forEach(
          (folderName: string, j) => {

            folder = this.findOrCreateFolder(folderName, folder, j, batch);

            if (j === currentFilesName.length - 1) {
              resolve(folder);
            }
          }
        );

      }
    );

  }

  createNewFile(file: any, parent: UploadedFile, batch: string): UploadedFile{
    return {
      isUploading: 0,
      hasUploaded: 0,
      isDeleting: 0,
      percentageLoaded: 0,
      pending: 1,
      name: file.name,
      originalType: file.type,
      isCompleted: 0,
      is_confirmed: 0,
      link: null,
      hasError: 0,
      hasJustUploaded: 0,
      is_folder: 0,
      batch,
      file,
      code: this.makeId(13),
      scale: parent ? parent.scale + 1 : -1,
      folderCode: parent ? parent.code : null,
      webkitRelativePath: file.webkitRelativePath
    };

  }

  sendFiles(): void {
    console.log(this.files);
    this.fileIsLoading = false;
    this.fileIsUploading = true;
    this.fileHasUploaded = false;
    this.uploadFiles(this.getNextPendingFile());

  }

  detectFile(event): void {
    const files: any = event.target.files;
    const isFolderImport = event.target.id === 'upload-folder-input';

    this.checkImages(files).then(
      () => {
        const currentFilesName: any = files[0].webkitRelativePath.toString().split('/');

        const batch = Date.now().toString();
        this.fileIsLoading = true;
        let folder: UploadedFile = this.folder;

        if (!isFolderImport) {
          this.files.push(this.createNewFile(files[0], folder, batch));
          this.sendFiles();
        }

        if (isFolderImport) {
          folder = this.createNewFolder(currentFilesName[0], folder, 0, batch);
          this.files.push(folder);

          Array.from(files).forEach((file: any, i) => {

            this.getFolder(file, batch, folder).then(
              (f: UploadedFile) => {

                this.files.push(this.createNewFile(file, f, batch));
              }

            );


            if (i === files.length - 1) {
              this.sendFiles();

            }

          });
        }

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
      return file.folder_id === this.folderId && file.is_confirmed === 1;
    }
    return !file.folder_id && file.is_confirmed === 1;
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

  getFileIconClass(file: UploadedFile): string {
    switch (file.type) {
      case 'pdf':
        return 'fa fa-file-pdf-o';
      case 'png':
        return 'fa fa-file-image-o';
      case 'jpeg':
        return 'fa fa-file-image-o';
      case 'xlsx':
        return 'fa fa-file-excel-o';
      case 'xls':
        return 'fa fa-file-excel-o';
      case 'docx':
        return 'fa fa-file-word-o';
      case 'mp4':
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
