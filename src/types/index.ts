// ─── Enum Types ───────────────────────────────────────────────────────────────

export type ApplicationStatus = 'Pending' | 'Submitted' | 'Reviewed' | 'Accepted' | 'Rejected'
export type AuditStatus = 'Active' | 'Completed' | 'Archived' | 'Pending' | 'InProgress' | 'Approved' | 'Rejected'
export type CareerPlanStatus = 'Planned' | 'InProgress' | 'Completed' | 'OnHold'
export type ComplianceRecordType = 'Certificate' | 'License' | 'Training' | 'Background'
export type EmployeeDocType = 'Resume' | 'Certificate' | 'License' | 'Identification'
export type EmployeeDocVerifyStatus = 'Pending' | 'Verified' | 'Rejected'
export type EmployeeStatus = 'Active' | 'OnLeave' | 'Inactive' | 'Terminated'
export type EnrollmentStatus = 'Enrolled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Overdue'
export type InterviewStatus = 'Pending' | 'Scheduled' | 'Completed' | 'Passed' | 'Failed' | 'Cancelled'
export type JobStatus = 'Open' | 'Closed'
export type NotificationCategory = 'System' | 'Recruitment' | 'Interview' | 'Performance' | 'Training' | 'Compliance' | 'Career' | 'Application' | 'Offer' | 'General'
export type NotificationStatus = 'Unread' | 'Read'
export type ResumeStatus = 'Active' | 'Inactive'
export type RoleName = 'Candidate' | 'Recruiter' | 'HR' | 'Employee' | 'Manager' | 'Admin'
export type ScreeningResult = 'Pass' | 'Fail' | 'Pending'
export type SelectionDecision = 'Selected' | 'Rejected'
export type SuccessionStatus = 'Planned' | 'InProgress' | 'Completed'
export type TrainingStatus = 'Planned' | 'Active' | 'Completed' | 'Cancelled'
export type TrainingType = 'Mandatory' | 'Onboarding' | 'Technical' | 'Leadership' | 'Certification' | 'Other'
export type DeliveryMode = 'InPerson' | 'Online' | 'Virtual' | 'OnJob' | 'Assessment'
export type UserStatus = 'Active' | 'Inactive' | 'Suspended' | 'Deleted'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  userId: number
  name: string
  email: string
  roles: string[]
}

export interface LoginResponse {
  token: string
  userID?: number
  /** alias used internally */
  userId?: number
  name?: string
  email?: string
  /** Backend returns a single role string */
  role?: string
  /** Normalised array used in Redux state */
  roles?: string[]
  createdAt?: string
}

export interface RegisterDTO {
  name: string
  email: string
  password: string
  phone?: string
}

export interface LoginDTO {
  email: string
  password: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserResponse {
  userID: number
  name: string
  email: string
  phone?: string
  status: UserStatus
  createdAt: string
}

export interface UserRoleResponse {
  userRoleId: number
  userId: number
  roleId: number
  roleName: RoleName
  userName: string
}

export interface RoleResponse {
  roleID: number
  name: RoleName
}

// ─── Employee ─────────────────────────────────────────────────────────────────

export interface EmployeeResponse {
  employeeID: number
  userId: number
  name: string
  department: string
  position: string
  joinDate: string
  status: EmployeeStatus
  managerID?: number
  managerName?: string
  email?: string
  phone?: string
  createdAt: string
}

export interface CreateEmployeeDTO {
  userId: number
  name: string
  department: string
  position: string
  joinDate: string
  status: EmployeeStatus
  managerID?: number
}

export interface UpdateEmployeeDTO {
  name?: string
  department?: string
  position?: string
  joinDate?: string
  status?: EmployeeStatus
  managerID?: number
}

// ─── Employee Document ────────────────────────────────────────────────────────

export interface EmployeeDocumentResponse {
  documentID: number
  employeeID: number
  docType: EmployeeDocType
  fileURI: string
  verifyStatus: EmployeeDocVerifyStatus
  createdAt: string
}

export interface CreateEmployeeDocumentDTO {
  employeeID: number
  docType: EmployeeDocType
  fileURI: string
}

export interface UpdateEmployeeDocumentDTO {
  verifyStatus?: EmployeeDocVerifyStatus
  fileURI?: string
  docType?: EmployeeDocType
}

// ─── Job ──────────────────────────────────────────────────────────────────────

export interface JobResponse {
  jobID: number
  title: string
  department: string
  description: string
  requirements: string
  postedDate: string
  status: JobStatus
  createdAt: string
}

export interface CreateJobDTO {
  title: string
  department: string
  description: string
  requirements: string
  status: JobStatus
}

export interface UpdateJobDTO {
  title?: string
  department?: string
  description?: string
  requirements?: string
  status?: JobStatus
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface ApplicationResponse {
  applicationID: number
  jobID: number
  jobTitle?: string
  candidateID: number
  candidateName?: string
  submittedDate: string
  status: ApplicationStatus
  createdAt: string
}

export interface CreateApplicationDTO {
  jobID: number
  candidateID: number
}

export interface UpdateApplicationDTO {
  status?: ApplicationStatus
}

// ─── Screening ────────────────────────────────────────────────────────────────

export interface ScreeningResponse {
  screeningID: number
  applicationID: number
  candidateName?: string
  jobTitle?: string
  result: ScreeningResult
  feedback?: string
  createdAt: string
}

export interface CreateScreeningDTO {
  applicationID: number
  result: ScreeningResult
  feedback?: string
}

export interface UpdateScreeningDTO {
  result?: ScreeningResult
  feedback?: string
}

// ─── Interview ────────────────────────────────────────────────────────────────

export interface InterviewResponse {
  interviewID: number
  applicationID: number
  candidateName?: string
  jobTitle?: string
  date: string
  time: string
  location: string
  interviewerID: number
  interviewerName?: string
  status: InterviewStatus
  feedback?: string
  createdAt: string
}

export interface CreateInterviewDTO {
  applicationID: number
  date: string
  time: string
  location: string
  interviewerID: number
  status: InterviewStatus
}

export interface ScheduleInterviewDTO {
  applicationID: number
  date: string
  time: string
  location: string
  interviewerID: number
}

export interface UpdateInterviewStatusDTO {
  status: InterviewStatus
  feedback?: string
}

// ─── Selection ────────────────────────────────────────────────────────────────

export interface SelectionResponse {
  selectionID: number
  applicationID: number
  candidateName?: string
  jobTitle?: string
  decision: SelectionDecision
  notes?: string
  date: string
  createdAt: string
}

export interface MakeSelectionDecisionDTO {
  applicationID: number
  decision: SelectionDecision
  notes?: string
}

// ─── Performance Review ───────────────────────────────────────────────────────

export interface PerformanceReviewResponse {
  reviewID: number
  employeeID: number
  employeeName?: string
  reviewDate: string
  rating: number
  comments?: string
  createdAt: string
}

export interface CreatePerformanceReviewDTO {
  employeeID: number
  reviewDate: string
  rating: number
  comments?: string
}

export interface UpdatePerformanceReviewDTO {
  reviewDate?: string
  rating?: number
  comments?: string
}

// ─── Career Plan ──────────────────────────────────────────────────────────────

export interface CareerPlanResponse {
  planID: number
  employeeID: number
  employeeName?: string
  title: string
  description?: string
  status: CareerPlanStatus
  createdAt: string
}

export interface CreateCareerPlanDTO {
  employeeID: number
  title: string
  description?: string
  status: CareerPlanStatus
}

export interface UpdateCareerPlanDTO {
  title?: string
  description?: string
  status?: CareerPlanStatus
}

// ─── Training ─────────────────────────────────────────────────────────────────

export interface TrainingResponse {
  trainingID: number
  title: string
  description?: string
  trainingType: TrainingType
  deliveryMode: DeliveryMode
  trainingLink?: string
  location?: string
  instructorName?: string
  classStartTime?: string
  classEndTime?: string
  maxCapacity?: number
  startDate: string
  endDate: string
  durationDays: number
  status: TrainingStatus
  createdAt: string
  updatedAt?: string
}

export interface CreateTrainingDTO {
  title: string
  description?: string
  trainingType: string
  deliveryMode: string
  trainingLink?: string
  location?: string
  instructorName?: string
  maxCapacity?: number
  startDate: string
  endDate: string
  status: string
}

export interface UpdateTrainingDTO {
  title?: string
  description?: string
  trainingType?: string
  deliveryMode?: string
  trainingLink?: string
  location?: string
  instructorName?: string
  maxCapacity?: number
  startDate?: string
  endDate?: string
  status?: string
}

export interface TrainingStatsDTO {
  totalTrainings: number
  activeTrainings: number
  totalEnrollments: number
  completedEnrollments: number
  overdueEnrollments: number
  completionRate: number
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export interface EnrollmentResponse {
  enrollmentID: number
  employeeID: number
  employeeName?: string
  trainingID: number
  trainingTitle?: string
  trainingType?: string
  deliveryMode?: string
  trainingLink?: string
  classStartTime?: string
  classEndTime?: string
  trainingStartDate?: string
  trainingEndDate?: string
  date: string
  dueDate?: string
  startedAt?: string
  completedAt?: string
  score?: number
  notes?: string
  certificateUrl?: string
  status: EnrollmentStatus
  isOverdue: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateEnrollmentDTO {
  employeeID: number
  trainingID: number
  dueDate?: string
}

export interface CompleteEnrollmentDTO {
  score?: number
  notes?: string
  certificateUrl?: string
}

// ─── Succession Plan ──────────────────────────────────────────────────────────

export interface SuccessionPlanResponse {
  successionID: number
  employeeID: number
  employeeName?: string
  successorID: number
  successorName?: string
  status: SuccessionStatus
  createdAt: string
}

export interface CreateSuccessionPlanDTO {
  employeeID: number
  successorID: number
  status: SuccessionStatus
}

export interface UpdateSuccessionPlanDTO {
  successorID?: number
  status?: SuccessionStatus
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export interface ComplianceRecordResponse {
  complianceID: number
  employeeID: number
  employeeName?: string
  recordType: ComplianceRecordType
  description?: string
  createdAt: string
}

export interface CreateComplianceRecordDTO {
  employeeID: number
  recordType: ComplianceRecordType
  description?: string
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditResponse {
  auditID: number
  description: string
  auditDate: string
  status: AuditStatus
  createdAt: string
}

export interface CreateAuditDTO {
  description: string
  auditDate: string
  status: AuditStatus
}

export interface AuditLogResponse {
  auditLogID: number
  userID: number
  userName?: string
  action: string
  entityType: string
  description?: string
  createdAt: string
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface ReportResponse {
  reportID: number
  reportType: string
  reportData: string
  generatedDate: string
  createdAt: string
}

export interface CreateReportDTO {
  reportType: string
  reportData: string
  generatedDate: string
}

export interface JobApplicationCountDTO {
  jobID: number
  jobTitle: string
  department: string
  applicationCount: number
  hiredCount: number
}

export interface HiringAnalytics {
  totalJobs: number
  totalApplications: number
  totalHired: number
  averageApplicationsPerJob: number
  applicationsPerJob: JobApplicationCountDTO[]
}

export interface DepartmentPerformanceDTO {
  department: string
  averageScore: number
  reviewCount: number
}

export interface TopPerformerDTO {
  employeeID: number
  employeeName: string
  department: string
  averageScore: number
  reviewCount: number
}

export interface PerformanceAnalytics {
  totalReviews: number
  overallAverageScore: number
  byDepartment: DepartmentPerformanceDTO[]
  topPerformers: TopPerformerDTO[]
}

export interface TrainingCompletionDTO {
  trainingID: number
  title: string
  status: string
  enrollmentCount: number
  completedCount: number
  completionRate: number
}

export interface TrainingAnalytics {
  totalTrainings: number
  totalEnrollments: number
  completedEnrollments: number
  overallCompletionRate: number
  byTraining: TrainingCompletionDTO[]
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface NotificationResponse {
  notificationID: number
  userID: number
  category: NotificationCategory
  message: string
  status: NotificationStatus
  createdAt: string
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export interface ResumeResponse {
  resumeID: number
  candidateID: number
  candidateName?: string
  fileURI: string
  uploadedDate: string
  status: ResumeStatus
  createdAt: string
  updatedAt?: string
}
