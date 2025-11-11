
import React, { useState, useMemo } from 'react';
import { TeamMember, AppUser, Organization } from '../types';
import Card from './common/Card';
import Input from './common/Input';
import Button from './common/Button';
import SentimentSparkline from './SentimentSparkline';

// Helper function to check for overdue tasks
const isOverdue = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  return due < today;
};

interface DataExplorerProps {
  teamMembers: TeamMember[];
  managers: AppUser[];
  organizations: Organization[];
}

type SortKey = 'name' | 'manager' | 'organization' | 'lastMeeting' | 'overdueCount';
interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

const DataExplorer: React.FC<DataExplorerProps> = ({ teamMembers, managers, organizations }) => {
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const enrichedTeamMembers = useMemo(() => {
    const managerMap = new Map(managers.map(m => [m.uid, m.email]));
    const orgMap = new Map(organizations.map(o => [o.id, o.name]));
    
    return teamMembers.map(member => {
      const openItems = member.previousMeeting?.actionItems.filter(item => item.status !== 'Completed') || [];
      return {
        ...member,
        manager: managerMap.get(member.userId) || 'N/A',
        organization: orgMap.get(member.organizationId) || 'N/A',
        openCount: openItems.length,
        overdueCount: openItems.filter(item => isOverdue(item.dueDate)).length,
        lastMeeting: member.meetingHistory.length > 0 ? new Date(member.meetingHistory[0].date) : null
      };
    });
  }, [teamMembers, managers, organizations]);


  const filteredAndSortedMembers = useMemo(() => {
    let sortableItems = [...enrichedTeamMembers];

    if (filterText) {
      const lowercasedFilter = filterText.toLowerCase();
      sortableItems = sortableItems.filter(member => 
        member.name.toLowerCase().includes(lowercasedFilter) ||
        member.role.toLowerCase().includes(lowercasedFilter) ||
        member.manager.toLowerCase().includes(lowercasedFilter)
      );
    }
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [enrichedTeamMembers, filterText, sortConfig]);

  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedMembers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedMembers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedMembers.length / itemsPerPage);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort
  };
  
  const getSortIndicator = (key: SortKey) => {
      if (!sortConfig || sortConfig.key !== key) return null;
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const TableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode, className?: string }> = ({ sortKey, children, className }) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center ${className || ''}`}>
        {children}
        <span className="ml-1 w-4 text-slate-400">{getSortIndicator(sortKey)}</span>
      </div>
    </th>
  );

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-900">Data Explorer</h2>
        <p className="mt-1 text-sm text-slate-600">
          A raw, filterable view of all team members across the selected organization or manager.
        </p>
        <div className="mt-4 max-w-sm">
          <Input
            id="data-explorer-filter"
            placeholder="Search by name, role, manager..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <TableHeader sortKey="name">Employee</TableHeader>
              <TableHeader sortKey="manager">Manager</TableHeader>
              <TableHeader sortKey="organization">Organization</TableHeader>
              <TableHeader sortKey="lastMeeting">Last Meeting</TableHeader>
              <TableHeader sortKey="overdueCount" className="justify-center">Overdue</TableHeader>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Sentiment Trend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedMembers.map(member => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">{member.name}</div>
                  <div className="text-sm text-slate-500">{member.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{member.manager}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{member.organization}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {member.lastMeeting ? member.lastMeeting.toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`text-sm font-semibold ${member.overdueCount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {member.overdueCount}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-24 h-8 mx-auto">
                        <SentimentSparkline history={member.meetingHistory} />
                    </div>
                </td>
              </tr>
            ))}
            {paginatedMembers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500">
                  No matching team members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
            <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                size="sm"
                variant="secondary"
            >
                Previous
            </Button>
            <span className="text-sm text-slate-700">
                Page {currentPage} of {totalPages}
            </span>
             <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                size="sm"
                variant="secondary"
            >
                Next
            </Button>
        </div>
      )}
    </Card>
  );
};

export default DataExplorer;
