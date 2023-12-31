import { Employee } from '../types';
import seedrandom from 'seedrandom';
import * as employeeData from './employeeData'
import { sendEmployeeDataToDatabase } from './databaseUtils';

/**
 * This function generates new employees.
 * It calculates their individual data such as hiring date, which is based on their position in the hiring order,
 * and sets their start date to a Monday the correct number of years ago.
 * The new employee's other details are also generated and sent to the server to be added to the database.
 */
export const generateEmployees = async (numEmployees: number, simStartYear: number, simEndYear: number, employeeHalfLife: number): Promise<void> => {

    // Stuff to put in the parameter form:
    let avgStartAge = 25;
    let stdevStartAge = 5;
    let depthOfMA = 3;

    let seed = 'mySeed';
    //seedrandom(seed, { global: true });

    // Calculate the expected number of employees per year
    const employeesPerYear = employeeData.calculateEmployeesPerYear(numEmployees, simStartYear, simEndYear);

    // Calculate the start and end dates for the employees who were employed at the start of the simulation
    const [employmentDates, endDatesCount] = employeeData.calculateInitialDates(employeesPerYear, simStartYear, employeeHalfLife);

    let initialEmployees = employmentDates;
    let employees: Employee[] = [];

    // Insert initial employees
    for (let initialEmployee of initialEmployees) {
        let birthDate = employeeData.calculateBirthDate(initialEmployee.startDate, avgStartAge, stdevStartAge);
        let educationLevel = employeeData.calculateEducation(initialEmployee.startDate.getFullYear(), birthDate.getFullYear());
        let yearsExperience = employeeData.calculateYearsExperience(initialEmployee.startDate.getFullYear(), educationLevel, birthDate.getFullYear());
        let sex = employeeData.calculateSex();
        let firstName = employeeData.calculateFirstName(sex, birthDate);
        let middleName = employeeData.calculateMiddleName(sex, birthDate, firstName);
        let lastName = employeeData.calculateLastName();
        let cellNumber = employeeData.calculatePhoneNumber(birthDate.getFullYear());
        let homeNumber = employeeData.calculatePhoneNumber(birthDate.getFullYear());
        let workNumber = employeeData.calculatePhoneNumber(birthDate.getFullYear());

        let employee: Employee = {
            ID: employees.length,
            DOB: birthDate.getTime(),
            Sex: sex,
            FirstName: firstName,
            MiddleName: middleName,
            LastName: lastName,
            Email: employeeData.calculateEmail(firstName, middleName, lastName),
            StartDate: initialEmployee.startDate.getTime(),
            EndDate: initialEmployee.endDate ? initialEmployee.endDate.getTime() : null,
            EducationLevel: educationLevel,
            YearsExperience: yearsExperience,
            StreetAddress: "",
            City: "",
            State: "",
            ZipCode: "",
            Country: "",
            CellNumber: cellNumber,
            HomeNumber: homeNumber,
            WorkNumber: workNumber,
            PositionID: 0,
            EmploymentType: "Full Time",
            SalaryID: 0,
            BranchID: 0,
            SupervisorID: 0,
            Status: "Removed"
        };
        employees.push(employee);
    }

    // Create a list of employee ages
    const employeeAges = employees.map(employee => simStartYear - new Date(employee.DOB).getFullYear());
    employeeData.trackEducationStatistics(simStartYear, simEndYear, employeeAges);
    console.log(employeeAges);

    // Count the number of current employees
    let numCurrentEmployees = employmentDates.length;
    

    for (let year = simStartYear; year <= simEndYear; year++) {
        // Calculate the number of new hires for the current year
        let yearNewHires = employeeData.yearNewHires(employeesPerYear, numCurrentEmployees, depthOfMA, year, endDatesCount);
        let startDates = employeeData.calculateStartDatesForYear(year, yearNewHires);
        numCurrentEmployees -= endDatesCount[year];
        numCurrentEmployees += yearNewHires;
        for (let i = 0; i < yearNewHires; i++) {
            let birthDate = employeeData.calculateBirthDate(startDates[i], avgStartAge, stdevStartAge);
            let educationLevel = employeeData.calculateEducation(year, birthDate.getFullYear());
            let yearsExperience = employeeData.calculateYearsExperience(year, educationLevel, birthDate.getFullYear());
            let sex = employeeData.calculateSex();
            let firstName = employeeData.calculateFirstName(sex, birthDate);
            let middleName = employeeData.calculateMiddleName(sex, birthDate, firstName);
            let lastName = employeeData.calculateLastName();
            let cellNumber = employeeData.calculatePhoneNumber(birthDate.getFullYear());
            let homeNumber = employeeData.calculatePhoneNumber(birthDate.getFullYear());
            let workNumber = employeeData.calculatePhoneNumber(birthDate.getFullYear());
            let employee: Employee = {
                ID: employees.length,
                StartDate: startDates[i].getTime(),
                EndDate: employeeData.calculateEndDate(startDates[i], employeeHalfLife).getTime(),
                EducationLevel: educationLevel,
                YearsExperience: yearsExperience,
                StreetAddress: "",
                City: "",
                State: "",
                ZipCode: "",
                Country: "",
                CellNumber: cellNumber,
                HomeNumber: homeNumber,
                WorkNumber: workNumber,
                DOB: birthDate.getTime(),
                Sex: sex,
                FirstName: firstName,
                MiddleName: middleName,
                LastName: lastName,
                Email: employeeData.calculateEmail(firstName, middleName, lastName),
                PositionID: 0,
                EmploymentType: "Full Time",
                SalaryID: 0,
                BranchID: 0,
                SupervisorID: 0,
                Status: "Removed"
            };
            employees.push(employee);
            
            if (employee.EndDate !== null) {
                let newEmploymentDates: employeeData.EmploymentDates = {
                    startDate: new Date(startDates[i]),
                    endDate: new Date(employee.EndDate)
                };
                employmentDates.push(newEmploymentDates);
                const endYear = new Date(employee.EndDate).getFullYear();
                if (endDatesCount[endYear]) {
                    endDatesCount[endYear]++;
                } else {
                    endDatesCount[endYear] = 1;
                }
            }
        }
    }

    // Send the employee data to the server
    let batchSize = 100;
    sendEmployeeDataToDatabase(employees, batchSize);

}
