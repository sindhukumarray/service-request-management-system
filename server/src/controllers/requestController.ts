import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceRequest } from '../models/ServiceRequest';
import mongoose from 'mongoose';

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, priority, aiSummary, aiSuggestedCategory, aiSuggestedPriority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Normalizers to ensure values conform to Mongoose enums
    const normalizePriority = (val?: string) => {
      if (!val) return 'MEDIUM';
      const v = val.toString().trim().toUpperCase();
      if (['URGENT', 'CRITICAL'].includes(v)) return 'URGENT';
      if (v === 'HIGH') return 'HIGH';
      if (v === 'MEDIUM') return 'MEDIUM';
      if (v === 'LOW') return 'LOW';
      // fallback
      return 'MEDIUM';
    };

    const normalizeCategory = (val?: string) => {
      if (!val) return 'OTHER';
      const v = val.toString().trim().toUpperCase();
      if (['SOFTWARE', 'HARDWARE', 'NETWORK', 'ACCESS', 'OTHER'].includes(v)) return v as any;
      // tries some common mappings
      if (v.includes('NET')) return 'NETWORK';
      if (v.includes('SOFT')) return 'SOFTWARE';
      if (v.includes('HARD')) return 'HARDWARE';
      if (v.includes('ACCESS') || v.includes('AUTH') || v.includes('PERM')) return 'ACCESS';
      return 'OTHER';
    };

    const normalizedCategory = normalizeCategory(category || aiSuggestedCategory);
    const normalizedPriority = normalizePriority(priority || aiSuggestedPriority);

    const newRequest = new ServiceRequest({
      title,
      description,
      aiSummary: aiSummary || undefined,
      aiSuggestedCategory: normalizeCategory(aiSuggestedCategory),
      aiSuggestedPriority: normalizePriority(aiSuggestedPriority),
      category: normalizedCategory,
      priority: normalizedPriority,
      status: 'OPEN',
      createdBy: req.user?.id,
      statusHistory: [
        {
          status: 'OPEN',
          changedBy: new mongoose.Types.ObjectId(req.user?.id),
          note: 'Request created',
        },
      ],
    });

    const savedRequest = await newRequest.save();
    return res.status(201).json(savedRequest);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create request', details: (error as Error).message });
  }
};

export const getRequests = async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.user?.role === 'ADMIN' ? {} : { createdBy: req.user?.id };

    const requests = await ServiceRequest.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const getRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findById(id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (req.user?.role !== 'ADMIN' && request.createdBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden: Access to this request is denied' });
    }

    return res.status(200).json(request);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching request details', details: (error as Error).message });
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = status;
    await request.save();
    return res.status(200).json(request);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update status', details: (error as Error).message });
  }
};

export const assignRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    return res.status(200).json({
      message: 'Request assignment simulated successfully (Mock)',
      request,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to assign request' });
  }
};

export const cancelRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (req.user?.role !== 'ADMIN' && request.createdBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden: You cannot cancel this request' });
    }

    request.status = 'CANCELLED';
    request.statusHistory.push({
      status: 'CANCELLED',
      changedBy: new mongoose.Types.ObjectId(req.user?.id),
      note: 'Cancelled by user',
      changedAt: new Date(),
    });

    await request.save();
    return res.status(200).json(request);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to cancel request', details: (error as Error).message });
  }
};
