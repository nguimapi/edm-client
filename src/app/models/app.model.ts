
export class UploadedFile {
    id?: number;
    user_id?: number;
    parent_id?: number;
    name?: string;
    type?: string;
    size?: number;
    files?: UploadedFile[];
    parents?: UploadedFile[];
    is_folder?: boolean;
    creation_date_human?: string;
    created_at?: string;
    updated_at?: string;
    consulted_at?: string;
    uploadName?: string;
    isUploading = false;
    isCompleted = false;
    percentageLoaded = 0;
    link: string = null;
    file?: File = null;
    hasError = false;
    hasUploaded = true;
    hasJustUploaded = false;
    isDeleting = false;
    pending = false;
}
