
import React, { useState, useRef } from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Dialog';
import Button from '../Button';
import { UploadCloudIcon } from '../../constants';

interface ImportDataModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent onClick={onClose}>
                <DialogHeader>
                    <DialogTitle>{t('importData')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t('importDataDesc')}</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".json" />
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloudIcon className="w-4 h-4 mr-2" />
                        {fileName ? t('fileSelected', { fileName }) : t('selectFile')}
                    </Button>
                </div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="button" onClick={onClose} disabled={!fileName}>{t('import')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ImportDataModal;
