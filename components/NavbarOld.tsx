
import React from 'react';
import Input from './Input';
import Button from './Button';
import { PlusIcon, SearchIcon } from '../constants';
import { useI18n } from '../i18n';

interface NavbarProps {
  onSearch: (query: string) => void;
  onAddNew: () => void;
  addNewLabel?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, onAddNew, addNewLabel }) => {
  const { t } = useI18n();
  return (
    <header className="flex items-center justify-between p-4 bg-background border-b border-border">
      <div className="w-full max-w-md">
        <Input 
          type="text"
          placeholder={t('searchVault')}
          icon={<SearchIcon className="w-5 h-5 text-gray-400" />}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <Button onClick={onAddNew}>
        <PlusIcon className="w-5 h-5 mr-2" />
        {addNewLabel || t('addNew')}
      </Button>
    </header>
  );
};

export default Navbar;
