"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

const StaffForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        eid: '',
        designation: '',
        phone: '',
        skillLevel: 'Junior',
        passKey: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="e.g. Dr. John Doe"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">EID</label>
                    <input
                        type="text"
                        name="eid"
                        value={formData.eid}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        placeholder="E-101"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        placeholder="017..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Login PassKey</label>
                    <input
                        type="text"
                        name="passKey"
                        value={formData.passKey}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono tracking-widest focus:ring-2 focus:ring-cyan-500 outline-none placeholder-slate-600"
                        placeholder="Set PassKey"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Designation</label>
                <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="e.g. Doctor, Nurse, Driver"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Skill/Experience Level</label>
                <select
                    name="skillLevel"
                    value={formData.skillLevel}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                    <option value="Senior">Senior / Consultant / In-charge</option>
                    <option value="Mid">Mid Level</option>
                    <option value="Junior">Junior / Trainee</option>
                </select>
            </div>

            <div className="flex justify-end gap-3 result-actions pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">Save Staff</Button>
            </div>
        </form>
    );
};

export default StaffForm;
