
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
    is_folder?: number;
    is_archived?: number;
    is_trashed?: number;
    creation_date_human?: string;
    creation_date?: string;
    created_at?: string;
    updated_at?: string;
    consulted_at?: string;
    isUploading = 0;
    isCompleted = 0;
    percentageLoaded = 0;
    link?: string = null;
    path?: string = null;
    file?: File = null;
    hasError = 0;
    hasUploaded = 0;
    hasJustUploaded = 0;
    isDeleting = 0;
    is_confirmed = 0;
    pending = 0;
    batch?: string;
    code?: string;
    scale?: number;
    folderCode?: string;
    originalType?: string;
    webkitRelativePath?: string;
    isFromFolderImport?: boolean;
}
