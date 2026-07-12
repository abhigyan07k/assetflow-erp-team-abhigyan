import prisma from '../config/db';
import logger from '../config/logger';

interface LogAuditInput {
  actionType: string;
  performedById: number;
  description: string;
}

const logAudit = async ({ actionType, performedById, description }: LogAuditInput): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: { actionType, performedById, description },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to write audit log: ${message}`);
  }
};

export default logAudit;
