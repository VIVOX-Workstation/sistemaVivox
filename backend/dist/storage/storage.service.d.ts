export declare class StorageService {
    private s3;
    private bucket;
    constructor();
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
}
