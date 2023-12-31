import React, { useState, useEffect } from 'react';
import EmployeeList from './components/EmployeeList';
import ParameterForm from './components/ParameterForm'; // Import the ParameterForm
import { getEmployeeDataFromDatabase } from './utils/databaseUtils';
import { Employee } from './types';  // Import the Employee interface

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);  // Specify that employees is an array of Employee objects

  useEffect(() => {
    const fetchEmployees = async () => {
      const data = await getEmployeeDataFromDatabase(10);
      setEmployees(data);
    };
    fetchEmployees();
  }, []);
  
  return (
    <div className="App">
      <h1>Employee List</h1>
      <ParameterForm setEmployees={setEmployees} />
      <EmployeeList employees={employees} />
    </div>
  );
}

export default App;
