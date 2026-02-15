"use client";

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StaffForm from './StaffForm';

const StaffList = ({ staffList, onAddStaff, onRemoveStaff }) => {
    // const [staffList, setStaffList] = useState(initialStaff); // Lifted up
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');

    const designations = ['All', 'Doctor', 'Nurse', 'Driver', 'Paramedic', 'PCS'];

    const handleFormSubmit = (newStaff) => {
        // ID generation should ideally happen in parent or here before passing up
        const staffWithId = { ...newStaff, id: Date.now() };
        onAddStaff(staffWithId);
        setIsModalOpen(false);
    };

    const handleDeleteClick = (staff) => {
        setStaffToDelete(staff);
        setDeletePassword('');
        setError('');
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletePassword === '04032023') {
            onRemoveStaff(staffToDelete.id);
            setIsDeleteModalOpen(false);
            setStaffToDelete(null);
        } else {
            setError('Incorrect Admin Password');
        }
    };

    const filteredStaff = filter === 'All'
        ? staffList
        : staffList.filter(s => s.designation === filter);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                        Staff Directory
                    </h2>
                    <p className="text-slate-400 text-sm">Total Staff: {staffList.length}</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>+ Add New Staff</Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {designations.map(role => (
                    <button
                        key={role}
                        onClick={() => setFilter(role)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === role
                            ? 'bg-cyan-500 text-white shadow-glow'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                            }`}
                    >
                        {role}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStaff.map(staff => (
                    <Card key={staff.id} className="hover:border-cyan-500/30 transition-colors group relative overflow-hidden">


                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                                    {staff.name}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium 
                    ${staff.designation === 'Doctor' ? 'bg-blue-500/20 text-blue-300' :
                                            staff.designation === 'Nurse' ? 'bg-pink-500/20 text-pink-300' :
                                                'bg-slate-500/20 text-slate-300'}`}>
                                        {staff.designation}
                                    </span>
                                    {staff.skillLevel && (
                                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                                            {staff.skillLevel}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-mono border border-slate-600 shadow-inner">
                                {staff.eid}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700/50 text-sm text-slate-400 space-y-1">
                            <div className="flex items-center gap-2">
                                <span>📞</span>
                                <span>{staff.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>🔐</span>
                                <span className="font-mono text-cyan-400 tracking-wider text-xs bg-cyan-900/20 px-1 rounded">{staff.passKey || '1234'}</span>
                            </div>
                        </div>

                        {/* Delete Action - Bottom Right */}
                        <div className="absolute bottom-3 right-3 transition-all duration-300">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click if needed
                                    handleDeleteClick(staff);
                                }}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all backdrop-blur-sm"
                                title="Delete Staff"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add Staff Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Staff Member"
            >
                <StaffForm
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Staff Deletion"
            >
                <div className="space-y-4">
                    <p className="text-slate-300">
                        Are you sure you want to delete <span className="font-bold text-white">{staffToDelete?.name}</span>?
                        <br />
                        <span className="text-red-400 text-sm">This action cannot be undone.</span>
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Admin Password</label>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="Enter Admin Password"
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleConfirmDelete}
                            disabled={!deletePassword}
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StaffList;
