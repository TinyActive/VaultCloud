
import React from 'react';
import { User } from '../../types';
import { useI18n } from '../../i18n';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { UsersIcon, UserCheckIcon, UserXIcon, ShieldIcon } from '../../constants';

interface AdminOverviewProps {
    users: User[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-base font-semibold text-muted-foreground">{title}</CardTitle>
        <div className="shrink-0">{icon}</div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-4xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
);

const AdminOverviewView: React.FC<AdminOverviewProps> = ({ users }) => {
    const { t } = useI18n();
    
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const suspendedUsers = users.filter(u => u.status === 'suspended').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    
    const recentlyActiveUsers = [...users]
      .filter(u => u.lastLogin !== 'Never')
      .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
      .slice(0, 5);

    return (
        <div className="w-full px-6 py-10 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="space-y-3 pb-4 border-b-2 border-border">
                <h1 className="text-4xl font-bold tracking-tight">{t('adminOverview')}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Overview of system statistics and user activity
                </p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title={t('totalUsers')} 
                    value={totalUsers} 
                    icon={<UsersIcon className="w-5 h-5 text-muted-foreground" />} 
                />
                <StatCard 
                    title={t('activeUsers')} 
                    value={activeUsers} 
                    icon={<UserCheckIcon className="w-5 h-5 text-green-500" />} 
                />
                <StatCard 
                    title={t('suspendedUsers')} 
                    value={suspendedUsers} 
                    icon={<UserXIcon className="w-5 h-5 text-red-500" />} 
                />
                <StatCard 
                    title={t('totalAdmins')} 
                    value={adminUsers} 
                    icon={<ShieldIcon className="w-5 h-5 text-accent" />} 
                />
            </div>
            
            {/* Recently Active Users */}
            <div className="space-y-5">
                <h2 className="text-2xl font-bold tracking-tight">{t('recentlyActiveUsers')}</h2>
                <Card className="overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-muted-foreground border-b">
                                <tr>
                                    <th className="p-4 font-medium whitespace-nowrap">{t('emailAddress')}</th>
                                    <th className="p-4 font-medium whitespace-nowrap">{t('role')}</th>
                                    <th className="p-4 font-medium whitespace-nowrap">{t('lastLogin')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentlyActiveUsers.map(user => (
                                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="p-4 font-medium">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${
                                                user.role === 'admin' 
                                                    ? 'bg-accent/20 text-accent' 
                                                    : 'bg-secondary text-secondary-foreground'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{user.lastLogin}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminOverviewView;
