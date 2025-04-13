import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  courseSections, type CourseSection, type InsertSection,
  courseLectures, type CourseLecture, type InsertLecture,
  nftOwnership, type NftOwnership, type InsertNftOwnership,
  temporaryAccess, type TemporaryAccess, type InsertTemporaryAccess,
  accessRequests, type AccessRequest, type InsertAccessRequest,
  courseRatings, type CourseRating, type InsertCourseRating,
  type CourseWithContent
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Course methods
  getCourse(id: number): Promise<Course | undefined>;
  getCourseWithContent(id: number): Promise<CourseWithContent | undefined>;
  getCoursesByCreator(creatorId: number): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
  getPublishedCoursesByCategory(category: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  
  // Course content methods
  createSection(section: InsertSection): Promise<CourseSection>;
  getSectionsByCourse(courseId: number): Promise<CourseSection[]>;
  updateSection(id: number, section: Partial<InsertSection>): Promise<CourseSection | undefined>;
  deleteSection(id: number): Promise<boolean>;
  
  createLecture(lecture: InsertLecture): Promise<CourseLecture>;
  getLecturesBySection(sectionId: number): Promise<CourseLecture[]>;
  updateLecture(id: number, lecture: Partial<InsertLecture>): Promise<CourseLecture | undefined>;
  deleteLecture(id: number): Promise<boolean>;
  
  // NFT and access methods
  getNftOwnership(id: number): Promise<NftOwnership | undefined>;
  getNftOwnershipByCourseAndOwner(courseId: number, ownerId: number): Promise<NftOwnership | undefined>;
  getOwnershipsByOwner(ownerId: number): Promise<(NftOwnership & { course: Course })[]>;
  createNftOwnership(ownership: InsertNftOwnership): Promise<NftOwnership>;
  
  createTemporaryAccess(access: InsertTemporaryAccess): Promise<TemporaryAccess>;
  getActiveTemporaryAccess(ownershipId: number, recipientAddress: string): Promise<TemporaryAccess | undefined>;
  getTemporaryAccessByOwnership(ownershipId: number): Promise<TemporaryAccess[]>;
  deactivateTemporaryAccess(id: number): Promise<boolean>;
  checkTemporaryAccess(courseId: number, walletAddress: string): Promise<boolean>;
  getSharedCoursesForWallet(walletAddress: string): Promise<(Course & { expiresAt: Date; shareId: number })[]>;
  
  // Access requests methods
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  getAccessRequestById(id: number): Promise<AccessRequest | undefined>;
  getAccessRequestsByCourse(courseId: number): Promise<AccessRequest[]>;
  getAccessRequestsByRequester(requesterAddress: string): Promise<(AccessRequest & { course: Course })[]>;
  getAccessRequestsByOwner(ownerAddress: string): Promise<(AccessRequest & { course: Course })[]>;
  updateAccessRequestStatus(id: number, status: string): Promise<AccessRequest | undefined>;
  
  // Course ratings and reviews methods
  createCourseRating(rating: InsertCourseRating): Promise<CourseRating>;
  getCourseRatingByUserAndCourse(userId: number, courseId: number): Promise<CourseRating | undefined>;
  getCourseRatings(courseId: number): Promise<(CourseRating & { user: User })[]>;
  getAverageRating(courseId: number): Promise<number>;
  updateCourseRating(id: number, rating: Partial<InsertCourseRating>): Promise<CourseRating | undefined>;
  deleteCourseRating(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private sections: Map<number, CourseSection>;
  private lectures: Map<number, CourseLecture>;
  private ownerships: Map<number, NftOwnership>;
  private temporaryAccesses: Map<number, TemporaryAccess>;
  private accessRequests: Map<number, AccessRequest>;
  private ratings: Map<number, CourseRating>;
  
  private userId: number;
  private courseId: number;
  private sectionId: number;
  private lectureId: number;
  private ownershipId: number;
  private temporaryAccessId: number;
  private accessRequestId: number;
  private ratingId: number;
  
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.sections = new Map();
    this.lectures = new Map();
    this.ownerships = new Map();
    this.temporaryAccesses = new Map();
    this.accessRequests = new Map();
    this.ratings = new Map();
    
    this.userId = 1;
    this.courseId = 1;
    this.sectionId = 1;
    this.lectureId = 1;
    this.ownershipId = 1;
    this.temporaryAccessId = 1;
    this.accessRequestId = 1;
    this.ratingId = 1;
    
    // Seed some initial data
    this.seedInitialData();
  }
  
  private seedInitialData() {
    // No initial data - courses will be created by users through the blockchain interface
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    // Case-insensitive wallet address comparison
    return Array.from(this.users.values()).find(user => 
      user.walletAddress?.toLowerCase() === walletAddress?.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      walletAddress: insertUser.walletAddress || null,
      isCreator: insertUser.isCreator || null,
      bio: insertUser.bio || null,
      avatarUrl: insertUser.avatarUrl || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async getCourseWithContent(id: number): Promise<CourseWithContent | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const creator = this.users.get(course.creatorId);
    if (!creator) return undefined;
    
    const sections = await this.getSectionsByCourse(id);
    
    const sectionsWithLectures = await Promise.all(
      sections.map(async section => {
        const lectures = await this.getLecturesBySection(section.id);
        return { ...section, lectures };
      })
    );
    
    // Get course ratings
    const ratings = await this.getCourseRatings(id);
    const averageRating = await this.getAverageRating(id);
    
    return {
      ...course,
      creator,
      sections: sectionsWithLectures,
      ratings,
      averageRating,
      totalRatings: ratings.length
    };
  }
  
  async getCoursesByCreator(creatorId: number): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter(course => course.creatorId === creatorId);
  }
  
  async getPublishedCourses(): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter(course => course.isPublished)
      .sort((a, b) => a.id - b.id);
  }
  
  async getPublishedCoursesByCategory(category: string): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter(course => course.isPublished && course.category === category);
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const now = new Date();
    const course: Course = { 
      ...insertCourse, 
      id, 
      createdAt: now, 
      nftContract: null,
      coverImageUrl: insertCourse.coverImageUrl || null,
      previewVideoUrl: insertCourse.previewVideoUrl || null,
      isPublished: insertCourse.isPublished || null
    };
    this.courses.set(id, course);
    return course;
  }
  
  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const existingCourse = this.courses.get(id);
    if (!existingCourse) return undefined;
    
    const updatedCourse = { ...existingCourse, ...course };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }
  
  // Course content methods
  async createSection(insertSection: InsertSection): Promise<CourseSection> {
    const id = this.sectionId++;
    const section: CourseSection = { ...insertSection, id };
    this.sections.set(id, section);
    return section;
  }
  
  async getSectionsByCourse(courseId: number): Promise<CourseSection[]> {
    return Array.from(this.sections.values())
      .filter(section => section.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createLecture(insertLecture: InsertLecture): Promise<CourseLecture> {
    const id = this.lectureId++;
    const lecture: CourseLecture = { 
      ...insertLecture, 
      id,
      videoUrl: insertLecture.videoUrl || null,
      resources: insertLecture.resources || null
    };
    this.lectures.set(id, lecture);
    return lecture;
  }
  
  async getLecturesBySection(sectionId: number): Promise<CourseLecture[]> {
    return Array.from(this.lectures.values())
      .filter(lecture => lecture.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  }
  
  async updateSection(id: number, section: Partial<InsertSection>): Promise<CourseSection | undefined> {
    const existingSection = this.sections.get(id);
    if (!existingSection) return undefined;
    
    const updatedSection = { ...existingSection, ...section };
    this.sections.set(id, updatedSection);
    return updatedSection;
  }
  
  async deleteSection(id: number): Promise<boolean> {
    if (!this.sections.has(id)) return false;
    
    // Find all lectures in this section
    const lectures = Array.from(this.lectures.values())
      .filter(lecture => lecture.sectionId === id);
    
    // Delete all lectures in the section
    for (const lecture of lectures) {
      this.lectures.delete(lecture.id);
    }
    
    // Delete the section
    return this.sections.delete(id);
  }
  
  async updateLecture(id: number, lecture: Partial<InsertLecture>): Promise<CourseLecture | undefined> {
    const existingLecture = this.lectures.get(id);
    if (!existingLecture) return undefined;
    
    const updatedLecture = { ...existingLecture, ...lecture };
    this.lectures.set(id, updatedLecture);
    return updatedLecture;
  }
  
  async deleteLecture(id: number): Promise<boolean> {
    return this.lectures.delete(id);
  }
  
  // NFT and access methods
  async getNftOwnership(id: number): Promise<NftOwnership | undefined> {
    return this.ownerships.get(id);
  }
  
  async getNftOwnershipByCourseAndOwner(courseId: number, ownerId: number): Promise<NftOwnership | undefined> {
    return Array.from(this.ownerships.values())
      .find(ownership => ownership.courseId === courseId && ownership.ownerId === ownerId);
  }
  
  async getOwnershipsByOwner(ownerId: number): Promise<(NftOwnership & { course: Course })[]> {
    const ownerships = Array.from(this.ownerships.values())
      .filter(ownership => ownership.ownerId === ownerId);
    
    return ownerships.map(ownership => {
      const course = this.courses.get(ownership.courseId);
      if (!course) {
        throw new Error(`Course not found for ownership ${ownership.id}`);
      }
      return { ...ownership, course };
    });
  }
  
  async createNftOwnership(insertOwnership: InsertNftOwnership): Promise<NftOwnership> {
    const id = this.ownershipId++;
    const now = new Date();
    const ownership: NftOwnership = { 
      ...insertOwnership, 
      id, 
      mintedAt: now,
      transactionHash: insertOwnership.transactionHash || null
    };
    this.ownerships.set(id, ownership);
    return ownership;
  }
  
  async createTemporaryAccess(insertAccess: InsertTemporaryAccess): Promise<TemporaryAccess> {
    const id = this.temporaryAccessId++;
    const now = new Date();
    const access: TemporaryAccess = { ...insertAccess, id, isActive: true, createdAt: now };
    this.temporaryAccesses.set(id, access);
    return access;
  }
  
  async getActiveTemporaryAccess(ownershipId: number, recipientAddress: string): Promise<TemporaryAccess | undefined> {
    const now = new Date();
    
    // Normalize the wallet address to lowercase for case-insensitive comparison
    const normalizedRecipientAddress = recipientAddress.toLowerCase();
    
    return Array.from(this.temporaryAccesses.values())
      .find(access => 
        access.ownershipId === ownershipId && 
        access.recipientAddress.toLowerCase() === normalizedRecipientAddress &&
        access.isActive &&
        access.expiresAt > now
      );
  }
  
  async getTemporaryAccessByOwnership(ownershipId: number): Promise<TemporaryAccess[]> {
    return Array.from(this.temporaryAccesses.values())
      .filter(access => access.ownershipId === ownershipId);
  }
  
  async deactivateTemporaryAccess(id: number): Promise<boolean> {
    const access = this.temporaryAccesses.get(id);
    if (!access) return false;
    
    access.isActive = false;
    this.temporaryAccesses.set(id, access);
    return true;
  }
  
  async checkTemporaryAccess(courseId: number, walletAddress: string): Promise<boolean> {
    const now = new Date();
    
    console.log(`Checking temporary access for courseId: ${courseId}, wallet: ${walletAddress}`);
    
    // Normalize the wallet address to lowercase for case-insensitive comparison
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Get all ownerships for this course
    const courseOwnerships = Array.from(this.ownerships.values())
      .filter(ownership => ownership.courseId === courseId);
    
    console.log(`Found ${courseOwnerships.length} ownerships for this course`);
    
    // Check if any have active temporary access for this wallet
    for (const ownership of courseOwnerships) {
      const hasAccess = Array.from(this.temporaryAccesses.values())
        .some(access => {
          const isOwnershipMatch = access.ownershipId === ownership.id;
          const isAddressMatch = access.recipientAddress.toLowerCase() === normalizedWalletAddress;
          const isActive = access.isActive;
          const isValid = access.expiresAt > now;
          
          console.log(`Access check: ownershipMatch=${isOwnershipMatch}, addressMatch=${isAddressMatch}, active=${isActive}, valid=${isValid}`);
          
          return isOwnershipMatch && isAddressMatch && isActive && isValid;
        });
      
      if (hasAccess) {
        console.log(`Temporary access found for courseId: ${courseId}, wallet: ${walletAddress}`);
        return true;
      }
    }
    
    console.log(`No temporary access found for courseId: ${courseId}, wallet: ${walletAddress}`);
    return false;
  }
  
  async getSharedCoursesForWallet(walletAddress: string): Promise<(Course & { expiresAt: Date; shareId: number })[]> {
    const now = new Date();
    
    // Log received wallet address for debugging
    console.log('Looking for shared courses for wallet address:', walletAddress);
    console.log('All temporary accesses:', Array.from(this.temporaryAccesses.values()));
    
    // Normalize the wallet address to lowercase for case-insensitive comparison
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Get all active temporary accesses for this wallet address
    const activeAccesses = Array.from(this.temporaryAccesses.values())
      .filter(access => {
        const normalized = access.recipientAddress.toLowerCase();
        const isMatch = normalized === normalizedWalletAddress;
        const isActive = access.isActive;
        const isValid = access.expiresAt > now;
        
        console.log(`Access ${access.id}: Address ${access.recipientAddress} matches: ${isMatch}, active: ${isActive}, valid: ${isValid}`);
        
        return isMatch && isActive && isValid;
      });
    
    console.log('Active accesses found:', activeAccesses);
    
    // If no accesses, return empty array
    if (activeAccesses.length === 0) return [];
    
    // Map to courses with expiration details
    const sharedCourses = [];
    
    for (const access of activeAccesses) {
      // Get the ownership
      const ownership = this.ownerships.get(access.ownershipId);
      if (!ownership) {
        console.log(`Ownership not found for access: ${access.id}, ownershipId: ${access.ownershipId}`);
        continue;
      }
      
      // Get the course
      const course = this.courses.get(ownership.courseId);
      if (!course) {
        console.log(`Course not found for ownership: ${ownership.id}, courseId: ${ownership.courseId}`);
        continue;
      }
      
      console.log(`Adding shared course: ${course.title} (ID: ${course.id})`);
      
      // Add to shared courses
      sharedCourses.push({
        ...course,
        expiresAt: access.expiresAt,
        shareId: access.id
      });
    }
    
    console.log('Returning shared courses:', sharedCourses);
    return sharedCourses;
  }
  
  // Course rating methods
  async createCourseRating(insertRating: InsertCourseRating): Promise<CourseRating> {
    const id = this.ratingId++;
    const now = new Date();
    const rating: CourseRating = { 
      ...insertRating, 
      id, 
      createdAt: now,
      updatedAt: now,
      review: insertRating.review || null
    };
    this.ratings.set(id, rating);
    return rating;
  }
  
  async getCourseRatingByUserAndCourse(userId: number, courseId: number): Promise<CourseRating | undefined> {
    return Array.from(this.ratings.values())
      .find(rating => rating.userId === userId && rating.courseId === courseId);
  }
  
  async getCourseRatings(courseId: number): Promise<(CourseRating & { user: User })[]> {
    const ratings = Array.from(this.ratings.values())
      .filter(rating => rating.courseId === courseId)
      .sort((a, b) => {
        // Handle potential null values for createdAt
        const dateA = a.createdAt ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      });
    
    return ratings.map(rating => {
      const user = this.users.get(rating.userId);
      if (!user) {
        throw new Error(`User not found for rating ${rating.id}`);
      }
      return { ...rating, user };
    });
  }
  
  async getAverageRating(courseId: number): Promise<number> {
    const ratings = Array.from(this.ratings.values())
      .filter(rating => rating.courseId === courseId);
    
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return sum / ratings.length;
  }
  
  async updateCourseRating(id: number, rating: Partial<InsertCourseRating>): Promise<CourseRating | undefined> {
    const existingRating = this.ratings.get(id);
    if (!existingRating) return undefined;
    
    const now = new Date();
    const updatedRating = { 
      ...existingRating, 
      ...rating, 
      updatedAt: now 
    };
    this.ratings.set(id, updatedRating);
    return updatedRating;
  }
  
  async deleteCourseRating(id: number): Promise<boolean> {
    return this.ratings.delete(id);
  }
  
  // Access request methods
  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const id = this.accessRequestId++;
    const now = new Date();
    const request: AccessRequest = {
      ...insertRequest,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertRequest.status || 'pending',
      requestMessage: insertRequest.requestMessage || null
    };
    this.accessRequests.set(id, request);
    return request;
  }
  
  async getAccessRequestById(id: number): Promise<AccessRequest | undefined> {
    return this.accessRequests.get(id);
  }
  
  async getAccessRequestsByCourse(courseId: number): Promise<AccessRequest[]> {
    return Array.from(this.accessRequests.values())
      .filter(request => request.courseId === courseId)
      .sort((a, b) => {
        // Handle potential null values for createdAt
        const dateA = a.createdAt ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      });
  }
  
  async getAccessRequestsByRequester(requesterAddress: string): Promise<(AccessRequest & { course: Course })[]> {
    // Normalize the wallet address to lowercase for case-insensitive comparison
    const normalizedRequesterAddress = requesterAddress.toLowerCase();
    
    const requests = Array.from(this.accessRequests.values())
      .filter(request => request.requesterAddress.toLowerCase() === normalizedRequesterAddress)
      .sort((a, b) => {
        // Handle potential null values for createdAt
        const dateA = a.createdAt ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      });
    
    return requests.map(request => {
      const course = this.courses.get(request.courseId);
      if (!course) {
        throw new Error(`Course not found for request ${request.id}`);
      }
      return { ...request, course };
    });
  }
  
  async getAccessRequestsByOwner(ownerAddress: string): Promise<(AccessRequest & { course: Course })[]> {
    // Normalize the wallet address to lowercase for case-insensitive comparison
    const normalizedOwnerAddress = ownerAddress.toLowerCase();
    
    const requests = Array.from(this.accessRequests.values())
      .filter(request => request.ownerAddress.toLowerCase() === normalizedOwnerAddress)
      .sort((a, b) => {
        // Handle potential null values for createdAt
        const dateA = a.createdAt ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      });
    
    return requests.map(request => {
      const course = this.courses.get(request.courseId);
      if (!course) {
        throw new Error(`Course not found for request ${request.id}`);
      }
      return { ...request, course };
    });
  }
  
  async updateAccessRequestStatus(id: number, status: string): Promise<AccessRequest | undefined> {
    const request = this.accessRequests.get(id);
    if (!request) return undefined;
    
    const now = new Date();
    const updatedRequest = {
      ...request,
      status,
      updatedAt: now
    };
    
    this.accessRequests.set(id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MemStorage();
