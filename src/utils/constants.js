export const SOURCES = {
    REFERRAL: 'REFERRAL',
    INTERNAL: 'INTERNAL',
    JOB_BOARD: 'JOB_BOARD',
    OTHER: 'OTHER'
  };
  
  export const APPLICATION_STATUS = {
    RECEIVED: 'RECEIVED',
    IN_REVIEW: 'IN_REVIEW',
    REJECTED: 'REJECTED',
    HIRED: 'HIRED'
  };
  
  export const VACANCY_STATUS = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED'
  };
  
  export const PRIORITIES = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    TOP: 'TOP'
  };
  
  export const ALLOWED_SOURCES = Object.values(SOURCES);
  export const ALLOWED_APPLICATION_STATUSES = Object.values(APPLICATION_STATUS);
  export const FINAL_STATUSES = [APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.HIRED];