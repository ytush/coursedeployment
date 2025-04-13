import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";

import { 
  insertUserSchema, 
  insertCourseSchema, 
  insertSectionSchema, 
  insertLectureSchema,
  insertNftOwnershipSchema,
  insertTemporaryAccessSchema,
  insertCourseRatingSchema,
  insertAccessRequestSchema,
  type InsertCourse
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Initialize libraries

// Configure multer for file uploads
const storage_dir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(storage_dir)) {
  fs.mkdirSync(storage_dir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, storage_dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Helper function to handle validation errors
  const validateRequest = (schema: any, data: any) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new Error(validationError.message);
      }
      throw error;
    }
  };

  // API Routes
  // All routes are prefixed with /api

  // User Routes
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const userData = validateRequest(insertUserSchema, req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/users/connect-wallet', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Normalize wallet address to lowercase for consistent storage and retrieval
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      // Check if user with this wallet already exists (case-insensitive)
      let user = await storage.getUserByWalletAddress(normalizedWalletAddress);
      
      if (!user) {
        // Create new user with wallet
        const username = `user_${Date.now()}`;
        user = await storage.createUser({
          username,
          password: `pw_${Date.now()}`, // In a real app, this would be handled differently
          walletAddress: normalizedWalletAddress, // Store lowercase version
          isCreator: false
        });
      } else if (user.walletAddress !== normalizedWalletAddress) {
        // If the user exists but wallet address case differs, update to normalized version
        user = await storage.updateUser(user.id, {
          walletAddress: normalizedWalletAddress
        });
      }
      
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Course Routes
  app.get('/api/courses', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const creatorId = req.query.creatorId ? parseInt(req.query.creatorId as string) : undefined;
      
      if (creatorId && !isNaN(creatorId)) {
        const courses = await storage.getCoursesByCreator(creatorId);
        return res.status(200).json(courses);
      }
      
      if (category) {
        const courses = await storage.getPublishedCoursesByCategory(category);
        return res.status(200).json(courses);
      }
      
      const courses = await storage.getPublishedCourses();
      res.status(200).json(courses);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/courses/:id', async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      const course = await storage.getCourseWithContent(courseId);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      res.status(200).json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/courses', upload.single('coverImage'), async (req: Request, res: Response) => {
    try {
      // Check if courseData is present
      if (!req.body.courseData) {
        return res.status(400).json({ message: "Missing courseData in request body" });
      }
      
      let courseData;
      try {
        courseData = JSON.parse(req.body.courseData);
        console.log("Parsed course data:", courseData);
      } catch (parseError) {
        console.error("Error parsing courseData:", parseError, "Raw data:", req.body.courseData);
        return res.status(400).json({ message: "Invalid courseData format, could not parse JSON" });
      }
      
      const validatedData = validateRequest(insertCourseSchema, {
        ...courseData,
        coverImageUrl: req.file ? `/uploads/${path.basename(req.file.path)}` : null
      });
      
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error: any) {
      console.error("Error creating course:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Course Content Routes
  app.post('/api/sections', async (req: Request, res: Response) => {
    try {
      const sectionData = validateRequest(insertSectionSchema, req.body);
      const section = await storage.createSection(sectionData);
      res.status(201).json(section);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/lectures', upload.single('video'), async (req: Request, res: Response) => {
    try {
      // Check if lectureData is present
      if (!req.body.lectureData) {
        return res.status(400).json({ message: "Missing lectureData in request body" });
      }
      
      let lectureData;
      try {
        lectureData = JSON.parse(req.body.lectureData);
        console.log("Parsed lecture data:", lectureData);
      } catch (parseError) {
        console.error("Error parsing lectureData:", parseError, "Raw data:", req.body.lectureData);
        return res.status(400).json({ message: "Invalid lectureData format, could not parse JSON" });
      }
      
      const validatedData = validateRequest(insertLectureSchema, {
        ...lectureData,
        videoUrl: req.file ? `/uploads/${path.basename(req.file.path)}` : null
      });
      
      const lecture = await storage.createLecture(validatedData);
      res.status(201).json(lecture);
    } catch (error: any) {
      console.error("Error creating lecture:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // NFT Routes
  app.post('/api/nft/mint', async (req: Request, res: Response) => {
    try {
      const { courseId, ownerId, tokenId, transactionHash } = req.body;
      
      // Validate the request
      const validatedData = validateRequest(insertNftOwnershipSchema, {
        courseId,
        ownerId,
        tokenId,
        transactionHash
      });
      
      // Check if course exists
      const course = await storage.getCourse(validatedData.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check if user already owns this NFT
      const existingOwnership = await storage.getNftOwnershipByCourseAndOwner(
        validatedData.courseId,
        validatedData.ownerId
      );
      
      if (existingOwnership) {
        return res.status(400).json({ message: 'User already owns this course NFT' });
      }
      
      // Create NFT ownership record
      const ownership = await storage.createNftOwnership(validatedData);
      
      res.status(201).json(ownership);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/nft/owned/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const ownerships = await storage.getOwnershipsByOwner(userId);
      res.status(200).json(ownerships);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get user profile data
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't send password to client
      const { password, ...userData } = user;
      
      res.status(200).json(userData);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Update user profile
  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user data
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Don't send password to client
      const { password, ...userData } = updatedUser || {};
      
      res.status(200).json(userData);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Upload user avatar
  app.post('/api/users/:id/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get the uploaded file
      const avatarFile = req.file;
      
      if (!avatarFile) {
        return res.status(400).json({ message: 'No avatar file uploaded' });
      }
      
      // Update user with new avatar URL
      // We need to use /uploads/filename format for web accessibility
      const avatarUrl = `/uploads/${path.basename(avatarFile.path)}`;
      const updatedUser = await storage.updateUser(userId, { avatarUrl });
      
      res.status(200).json({ avatarUrl });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Temporary Access Routes
  app.post('/api/access/share', async (req: Request, res: Response) => {
    try {
      const { ownershipId, recipientAddress, expiresAt } = req.body;
      
      if (!recipientAddress) {
        return res.status(400).json({ message: 'Recipient wallet address is required' });
      }
      
      // Normalize recipient wallet address
      const normalizedRecipientAddress = recipientAddress.toLowerCase();
      
      // Validate the request
      const validatedData = validateRequest(insertTemporaryAccessSchema, {
        ownershipId,
        recipientAddress: normalizedRecipientAddress, // Store normalized address
        expiresAt: new Date(expiresAt)
      });
      
      // Check if ownership exists
      const ownership = await storage.getNftOwnership(validatedData.ownershipId);
      if (!ownership) {
        return res.status(404).json({ message: 'NFT ownership not found' });
      }
      
      // Check if active access already exists (using normalized address)
      const existingAccess = await storage.getActiveTemporaryAccess(
        validatedData.ownershipId,
        normalizedRecipientAddress
      );
      
      if (existingAccess) {
        return res.status(400).json({ 
          message: 'Active temporary access already exists for this recipient' 
        });
      }
      
      // Create temporary access with normalized address
      const access = await storage.createTemporaryAccess(validatedData);
      
      res.status(201).json(access);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/access/check', async (req: Request, res: Response) => {
    try {
      const { courseId, walletAddress } = req.body;
      
      if (!courseId || !walletAddress) {
        return res.status(400).json({ 
          message: 'Course ID and wallet address are required' 
        });
      }
      
      // Normalize wallet address for consistent lookup
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      // Check for direct ownership
      const user = await storage.getUserByWalletAddress(normalizedWalletAddress);
      
      if (user) {
        const directOwnership = await storage.getNftOwnershipByCourseAndOwner(
          courseId,
          user.id
        );
        
        if (directOwnership) {
          return res.status(200).json({ 
            hasAccess: true, 
            accessType: 'owner' 
          });
        }
      }
      
      // Check for temporary access
      const hasTemporaryAccess = await storage.checkTemporaryAccess(
        courseId,
        normalizedWalletAddress
      );
      
      if (hasTemporaryAccess) {
        return res.status(200).json({ 
          hasAccess: true, 
          accessType: 'temporary' 
        });
      }
      
      // No access
      res.status(200).json({ 
        hasAccess: false 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get('/api/access/shared/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Normalize wallet address for consistent lookup
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      const sharedCourses = await storage.getSharedCoursesForWallet(normalizedWalletAddress);
      res.status(200).json(sharedCourses);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/access/revoke/:accessId', async (req: Request, res: Response) => {
    try {
      const accessId = parseInt(req.params.accessId);
      
      if (isNaN(accessId)) {
        return res.status(400).json({ message: 'Invalid access ID' });
      }
      
      const deactivated = await storage.deactivateTemporaryAccess(accessId);
      
      if (!deactivated) {
        return res.status(404).json({ message: 'Temporary access not found' });
      }
      
      res.status(200).json({ message: 'Temporary access revoked successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Course Management Routes
  
  // Update course
  app.patch('/api/courses/:id', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'previewVideo', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Prepare updated course data
      const updateData: Partial<InsertCourse> = {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        price: req.body.price,
        duration: req.body.duration,
        isPublished: req.body.isPublished === 'true',
      };
      
      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files.coverImage && files.coverImage[0]) {
        updateData.coverImageUrl = `/uploads/${path.basename(files.coverImage[0].path)}`;
      }
      
      if (files.previewVideo && files.previewVideo[0]) {
        updateData.previewVideoUrl = `/uploads/${path.basename(files.previewVideo[0].path)}`;
      }
      
      // Update the course
      const updatedCourse = await storage.updateCourse(courseId, updateData);
      
      res.status(200).json(updatedCourse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Toggle course publish status
  app.post('/api/courses/:id/publish', async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Toggle publish status
      const isPublished = req.body.isPublished;
      
      const updatedCourse = await storage.updateCourse(courseId, { 
        isPublished: isPublished === true || isPublished === 'true' 
      });
      
      res.status(200).json(updatedCourse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Section Management Routes
  
  // Update section
  app.patch('/api/sections/:id', async (req: Request, res: Response) => {
    try {
      const sectionId = parseInt(req.params.id);
      
      if (isNaN(sectionId)) {
        return res.status(400).json({ message: 'Invalid section ID' });
      }
      
      // Validate the request
      const validatedData = validateRequest(insertSectionSchema.partial(), req.body);
      
      // Get all sections to check if order is valid
      const sections = await storage.getSectionsByCourse(validatedData.courseId);
      const sectionToUpdate = sections.find(s => s.id === sectionId);
      
      if (!sectionToUpdate) {
        return res.status(404).json({ message: 'Section not found' });
      }
      
      // Update the section
      const updatedSection = await storage.updateSection(sectionId, validatedData);
      
      res.status(200).json(updatedSection);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Delete section
  app.delete('/api/sections/:id', async (req: Request, res: Response) => {
    try {
      const sectionId = parseInt(req.params.id);
      
      if (isNaN(sectionId)) {
        return res.status(400).json({ message: 'Invalid section ID' });
      }
      
      const result = await storage.deleteSection(sectionId);
      
      if (!result) {
        return res.status(404).json({ message: 'Section not found' });
      }
      
      res.status(200).json({ message: 'Section deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Lecture Management Routes
  
  // Update lecture
  app.patch('/api/lectures/:id', upload.single('video'), async (req: Request, res: Response) => {
    try {
      const lectureId = parseInt(req.params.id);
      
      if (isNaN(lectureId)) {
        return res.status(400).json({ message: 'Invalid lecture ID' });
      }
      
      // Validate the request
      const data = {
        ...req.body,
        order: parseInt(req.body.order),
        resources: req.body.resources ? JSON.parse(req.body.resources) : {},
      };
      
      const validatedData = validateRequest(insertLectureSchema.partial(), data);
      
      // If a video file was uploaded, add its path
      if (req.file) {
        validatedData.videoUrl = `/uploads/${path.basename(req.file.path)}`;
      }
      
      // Update the lecture
      const updatedLecture = await storage.updateLecture(lectureId, validatedData);
      
      res.status(200).json(updatedLecture);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Delete lecture
  app.delete('/api/lectures/:id', async (req: Request, res: Response) => {
    try {
      const lectureId = parseInt(req.params.id);
      
      if (isNaN(lectureId)) {
        return res.status(400).json({ message: 'Invalid lecture ID' });
      }
      
      const result = await storage.deleteLecture(lectureId);
      
      if (!result) {
        return res.status(404).json({ message: 'Lecture not found' });
      }
      
      res.status(200).json({ message: 'Lecture deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Course Rating Routes
  
  // Submit a course rating
  app.post('/api/courses/:id/ratings', async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      // Validate course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      const { userId, rating, review } = req.body;
      
      if (!userId || !rating) {
        return res.status(400).json({ message: 'User ID and rating are required' });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user has already rated this course
      const existingRating = await storage.getCourseRatingByUserAndCourse(userId, courseId);
      
      if (existingRating) {
        // Update existing rating
        const updatedRating = await storage.updateCourseRating(existingRating.id, {
          rating,
          review
        });
        
        return res.status(200).json(updatedRating);
      }
      
      // Validate the request
      const validatedData = validateRequest(insertCourseRatingSchema, {
        courseId,
        userId,
        rating,
        review
      });
      
      // Create new rating
      const newRating = await storage.createCourseRating(validatedData);
      res.status(201).json(newRating);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get course ratings
  app.get('/api/courses/:id/ratings', async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Get ratings
      const ratings = await storage.getCourseRatings(courseId);
      const averageRating = await storage.getAverageRating(courseId);
      
      res.status(200).json({
        ratings,
        averageRating,
        totalRatings: ratings.length
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get user's rating for a course
  app.get('/api/courses/:courseId/ratings/user/:userId', async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(courseId) || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid course ID or user ID' });
      }
      
      // Get user's rating
      const rating = await storage.getCourseRatingByUserAndCourse(userId, courseId);
      
      if (!rating) {
        return res.status(404).json({ message: 'Rating not found' });
      }
      
      res.status(200).json(rating);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Delete a rating
  app.delete('/api/ratings/:id', async (req: Request, res: Response) => {
    try {
      const ratingId = parseInt(req.params.id);
      
      if (isNaN(ratingId)) {
        return res.status(400).json({ message: 'Invalid rating ID' });
      }
      
      const result = await storage.deleteCourseRating(ratingId);
      
      if (!result) {
        return res.status(404).json({ message: 'Rating not found' });
      }
      
      res.status(200).json({ message: 'Rating deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(storage_dir));
  
  // Access Request Routes
  app.post('/api/access-requests', async (req: Request, res: Response) => {
    try {
      const requestData = validateRequest(insertAccessRequestSchema, req.body);
      
      // Normalize wallet addresses for consistent storage and lookup
      const normalizedRequesterAddress = requestData.requesterAddress.toLowerCase();
      const normalizedOwnerAddress = requestData.ownerAddress.toLowerCase();
      
      const accessRequest = await storage.createAccessRequest({
        ...requestData,
        requesterAddress: normalizedRequesterAddress,
        ownerAddress: normalizedOwnerAddress,
        status: 'pending' // Ensure status is set to pending for new requests
      });
      
      res.status(201).json(accessRequest);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get access requests by course
  app.get('/api/access-requests/course/:courseId', async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      const requests = await storage.getAccessRequestsByCourse(courseId);
      res.status(200).json(requests);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get access requests by requester wallet address
  app.get('/api/access-requests/requester/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Normalize wallet address for consistent lookup
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      const requests = await storage.getAccessRequestsByRequester(normalizedWalletAddress);
      res.status(200).json(requests);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get access requests by owner wallet address
  app.get('/api/access-requests/owner/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Normalize wallet address for consistent lookup
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      const requests = await storage.getAccessRequestsByOwner(normalizedWalletAddress);
      res.status(200).json(requests);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Update access request status (approve/reject)
  app.patch('/api/access-requests/:id/status', async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(requestId)) {
        return res.status(400).json({ message: 'Invalid request ID' });
      }
      
      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const request = await storage.getAccessRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: 'Access request not found' });
      }
      
      const updatedRequest = await storage.updateAccessRequestStatus(requestId, status);
      
      // If request was approved, automatically create temporary access
      if (status === 'approved') {
        try {
          // First, find the ownership record
          const user = await storage.getUserByWalletAddress(request.ownerAddress);
          
          if (!user) {
            return res.status(404).json({ message: 'Owner user not found' });
          }
          
          const ownership = await storage.getNftOwnershipByCourseAndOwner(request.courseId, user.id);
          
          if (!ownership) {
            return res.status(404).json({ message: 'Owner does not own this course' });
          }
          
          // Calculate expiration date based on request duration
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + request.requestDuration);
          
          // Create temporary access
          await storage.createTemporaryAccess({
            ownershipId: ownership.id,
            recipientAddress: request.requesterAddress,
            expiresAt
          });
          
          res.status(200).json({ 
            ...updatedRequest, 
            accessGranted: true,
            expiresAt
          });
        } catch (accessError: any) {
          console.error('Error creating temporary access:', accessError);
          // Still return success for the status update, but include error info
          res.status(200).json({ 
            ...updatedRequest, 
            accessGranted: false,
            error: accessError.message
          });
        }
      } else {
        res.status(200).json(updatedRequest);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
