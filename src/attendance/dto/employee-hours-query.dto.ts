export class EmployeeHoursQueryDto {
  startDate: string;
  endDate: string;
  companyId?: string;
  page?: string;
  filterType?: string;
  filterValue?: string;
  search?: string;
}
