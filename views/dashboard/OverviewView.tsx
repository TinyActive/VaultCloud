
import React from 'react';
import { Entry } from '../../types';
import { useI18n } from '../../i18n';
import { Card, CardHeader, CardContent, CardDescription } from '../../components/Card';
import AllEntriesView from './AllEntriesView';

interface OverviewViewProps {
    entries: Entry[];
    onEditEntry: (entry: Entry) => void;
    onDeleteEntry: (entry: Entry) => void;
    onCopyPassword?: (entry: Entry) => Promise<void>;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardDescription className="text-base font-semibold">{title}</CardDescription>
        {icon}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-5xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
);

const OverviewView: React.FC<OverviewViewProps> = ({ entries, onEditEntry, onDeleteEntry, onCopyPassword, onShowToast }) => {
    const { t } = useI18n();
    const recentlyAdded = entries.slice(0, 5);
    return (
        <div className="space-y-10">
            <h2 className="text-4xl font-bold tracking-tight">{t('overview')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title={t('totalEntries')} value={entries.length} />
                <StatCard title={t('sharedWithYou')} value="5" />
                <StatCard title={t('securityScore')} value="98%" />
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold tracking-tight">{t('recentlyAdded')}</h3>
              <AllEntriesView entries={recentlyAdded} onEditEntry={onEditEntry} onDeleteEntry={onDeleteEntry} onCopyPassword={onCopyPassword} onShowToast={onShowToast} />
            </div>
        </div>
    );
};

export default OverviewView;
