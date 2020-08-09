export class Image {
    public id?: number;
    public link: string;
    public url: string;
    public description?: string;
    public title?: string;
    public product_id?: string;
}

export class UploadedImage {
    public id?: number;
    public uploadName?: string;
    public isUploading?: boolean = false;
    public percentageLoaded?: number = 0;
    public link: any;
    public file?: File;
    public hasError?: boolean = false;
    public hasUploaded?: boolean;
    public hasJustUploaded?: boolean = false;
    public isDeleting?: boolean = false;
    public pending?: boolean = false;
}
