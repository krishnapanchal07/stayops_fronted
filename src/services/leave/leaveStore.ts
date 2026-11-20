import seedPasses from '@/mock/gatePasses.json';
import seedLeaves from '@/mock/leaves.json';
import type { GatePass, LeaveRequest } from '@/types/leave';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let leaves: LeaveRequest[] = clone(seedLeaves as LeaveRequest[]);
let passes: GatePass[] = clone(seedPasses as GatePass[]);

export const leaveStore = {
  list(): LeaveRequest[] {
    return clone(leaves);
  },
  get(id: string): LeaveRequest | undefined {
    const item = leaves.find((leave) => leave.id === id);
    return item ? clone(item) : undefined;
  },
  insert(record: LeaveRequest): LeaveRequest {
    leaves = [record, ...leaves];
    return clone(record);
  },
  persist(record: LeaveRequest): LeaveRequest {
    leaves = leaves.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
  listPasses(): GatePass[] {
    return clone(passes);
  },
  getPass(id: string): GatePass | undefined {
    const item = passes.find((pass) => pass.id === id);
    return item ? clone(item) : undefined;
  },
  findPassByCode(code: string): GatePass | undefined {
    const item = passes.find((pass) => pass.passCode.toLowerCase() === code.trim().toLowerCase());
    return item ? clone(item) : undefined;
  },
  insertPass(record: GatePass): GatePass {
    passes = [record, ...passes];
    return clone(record);
  },
  persistPass(record: GatePass): GatePass {
    passes = passes.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
};
