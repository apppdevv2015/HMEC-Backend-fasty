require('dotenv').config({ path: '../services/auth-service/.env' });
const emailUtils = require('../services/auth-service/src/utils/email.utils');
const templateService = require('../services/auth-service/src/modules/auth/services/template.service');

async function testEmailFlow() {
  console.log("=========================================");
  console.log("HME Staff Welcome Email Flow Tester");
  console.log("=========================================");
  
  const targetEmail = process.argv[2] || "hme-staff-test@yopmail.com";
  
  try {
    const html = await templateService.getTemplate('staff-welcome', {
      name: "Test Staff Operator",
      roleName: "OPERATOR",
      companyName: "HME Mining Operations",
      companyCode: "HME-2026",
      email: targetEmail,
      password: "TempPass#2026",
      loginUrl: "http://localhost:5173/signin"
    });

    console.log(`Sending Welcome Email with Credentials to: ${targetEmail}...`);
    await emailUtils.sendEmailNow({
      to: targetEmail,
      subject: "Welcome to HME Intelligence Team! 👷‍♂️",
      html: html
    });
    console.log("Email dispatch completed!");
    console.log(`Check Inbox at: https://yopmail.com?${targetEmail.split('@')[0]}`);
    console.log("=========================================");
  } catch (err) {
    console.error("Email test failed:", err);
  }
}

testEmailFlow();
