import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';
import Textarea from './common/Textarea';

interface AddEditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<TeamMember, 'id' | 'userId' | 'previousMeeting' | 'meetingHistory' | 'organizationId'> | TeamMember) => Promise<void>;
  memberToEdit: TeamMember | null;
}

const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({ isOpen, onClose, onSave, memberToEdit }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [careerAspirations, setCareerAspirations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setName(memberToEdit.name);
        setRole(memberToEdit.role);
        setCareerAspirations(memberToEdit.careerAspirations);
      } else {
        setName('');
        setRole('');
        setCareerAspirations('');
      }
      setError(null);
    }
  }, [memberToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (memberToEdit) {
        await onSave({ ...memberToEdit, name, role, careerAspirations });
      } else {
        await onSave({ name, role, careerAspirations });
      }
      onClose();
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900">
              {memberToEdit ? 'Edit Team Member' : 'Add New Team Member'}
            </h2>
          </div>
          <div className="p-6 border-t border-b border-slate-200 space-y-4">
            <Input
              label="Full Name"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex Doe"
              required
              disabled={isLoading}
            />
            <Input
              label="Role"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              required
              disabled={isLoading}
            />
             <Textarea
              label="Career Aspirations"
              id="aspirations"
              value={careerAspirations}
              onChange={(e) => setCareerAspirations(e.target.value)}
              placeholder="e.g., Grow into a Tech Lead role, contribute to open-source projects, and mentor junior developers."
              required
              disabled={isLoading}
              rows={3}
            />
            {error && <p className="text-xs text-center text-red-600 pt-2">{error}</p>}
          </div>
          <div className="p-4 bg-slate-50 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? <Spinner small /> 
                : (memberToEdit ? 'Save Changes' : 'Add Member')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditMemberModal;