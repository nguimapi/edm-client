
export class UploadedFile {
    id?: number;
    user_id?: number;
    folder_id?: number;
    name?: string;
    type?: string;
    size?: number;
    display_size?: number;
    files?: UploadedFile[];
    parents?: UploadedFile[];
    is_folder?: boolean;
    creation_date_human?: string;
    creation_date?: string;
    created_at?: string;
    updated_at?: string;
    consulted_at?: string;
    isUploading = false;
    isCompleted = false;
    percentageLoaded = 0;
    link?: string = null;
    path?: string = null;
    file?: File = null;
    hasError = false;
    hasUploaded = true;
    hasJustUploaded = false;
    isDeleting = false;
    isConfirmed = false;
    pending = false;
    batch?: string;
    code?: string;
    scale?: number;
    folderCode?: string;
    originalType?: string;
    webkitRelativePath?: string;
}
