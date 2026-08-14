require('dotenv').config({ path: '../services/auth-service/.env' });
const userService = require('../services/auth-service/src/modules/user/services/user.service');

async function testMachineAssignmentEmail() {
  console.log("=========================================");
  console.log("Testing 2-Way Machine Assignment Email Flow");
  console.log("=========================================");

  const payload = {
    supervisorName: "Marcus Supervisor",
    supervisorEmail: "supervisor-test@yopmail.com",
    operatorName: "Rajesh Kumar (Operator)",
    operatorEmail: "operator-test@yopmail.com",
    machineName: "CAT 797F Heavy Haul Dump Truck",
    serialNumber: "CAT-797F-9941",
    shift: "Morning Shift (06:00 AM - 02:00 PM)",
    assignedAt: new Date().toISOString()
  };

  console.log("Sending assignment emails...");
  await userService.sendMachineAssignmentEmails(payload);
  console.log("Completed!");
  console.log("=========================================");
  console.log("1. Supervisor Email Inbox: https://yopmail.com?supervisor-test");
  console.log("2. Operator Email Inbox: https://yopmail.com?operator-test");
  console.log("=========================================");
}

testMachineAssignmentEmail();
