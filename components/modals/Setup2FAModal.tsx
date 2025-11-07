
import React from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Dialog';
import Input from '../Input';
import Button from '../Button';
import { QrCodeIcon } from '../../constants';

interface Setup2FAModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEnable: () => void;
}

const Setup2FAModal: React.FC<Setup2FAModalProps> = ({ isOpen, onClose, onEnable }) => {
    const { t } = useI18n();
    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent onClick={onClose}>
                <DialogHeader>
                    <DialogTitle>{t('confirm2FASetup')}</DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-4">
                    <div className="mx-auto bg-white p-2 inline-block rounded-lg">
                        <QrCodeIcon className="w-32 h-32 text-black" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('scanQRCodeDesc')}</p>
                    <p className="text-sm font-medium">{t('enterVerificationCode')}</p>
                    <Input id="2fa-code" type="text" placeholder="123456" className="text-center tracking-[0.5em] text-lg" />
                </div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="button" onClick={onEnable}>{t('verify')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default Setup2FAModal;
