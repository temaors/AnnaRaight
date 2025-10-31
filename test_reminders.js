#!/usr/bin/env node

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testReminderSystem() {
  console.log('🧪 Testing Reminder System...\n');

  try {
    // 1. Test creating a lead with reminder scheduling
    console.log('1️⃣ Creating test lead...');
    
    const testLead = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.${Date.now()}@example.com`,
      phone: '+1234567890',
      videoUrl: '/video'
    };

    const leadResponse = await fetch(`${BASE_URL}/api/lead/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLead),
    });

    const leadResult = await leadResponse.json();
    console.log('✅ Lead created:', leadResult.success ? 'SUCCESS' : 'FAILED');
    if (!leadResult.success) {
      console.error('❌ Lead creation error:', leadResult.error);
      return;
    }

    // 2. Check reminder status
    console.log('\n2️⃣ Checking reminder status...');
    
    const statusResponse = await fetch(`${BASE_URL}/api/reminders/status`);
    const statusResult = await statusResponse.json();
    
    if (statusResult.success) {
      console.log('✅ Reminder system status check: SUCCESS');
      console.log('📊 Summary:');
      console.log('   - Pending reminders:', statusResult.summary.pending.reduce((sum, item) => sum + item.count, 0));
      console.log('   - Total by status:', statusResult.summary.totalByStatus);
      
      if (statusResult.summary.overdueReminders.length > 0) {
        console.log('⚠️  Overdue reminders found:', statusResult.summary.overdueReminders.length);
      }
    } else {
      console.log('❌ Reminder status check: FAILED');
      console.error('Error:', statusResult.error);
    }

    // 3. Test manual processing
    console.log('\n3️⃣ Testing manual reminder processing...');
    
    const processResponse = await fetch(`${BASE_URL}/api/process-reminders`);
    const processResult = await processResponse.json();
    
    if (processResult.success) {
      console.log('✅ Manual processing: SUCCESS');
      console.log('📧 Results:');
      console.log(`   - Processed: ${processResult.processed || 0}`);
      console.log(`   - Sent: ${processResult.sent || 0}`);
      console.log(`   - Failed: ${processResult.failed || 0}`);
    } else {
      console.log('❌ Manual processing: FAILED');
      console.error('Error:', processResult.error);
    }

    // 4. Final status check
    console.log('\n4️⃣ Final status check...');
    
    const finalStatusResponse = await fetch(`${BASE_URL}/api/reminders/status`);
    const finalStatusResult = await finalStatusResponse.json();
    
    if (finalStatusResult.success) {
      const totalPending = finalStatusResult.summary.pending.reduce((sum, item) => sum + item.count, 0);
      console.log(`✅ Final check: ${totalPending} pending reminders`);
      
      if (totalPending > 0) {
        console.log('📅 Upcoming reminders:');
        finalStatusResult.summary.upcomingReminders.forEach(reminder => {
          console.log(`   - ${reminder.reminderType}: ${reminder.count} (next: ${new Date(reminder.nextScheduled).toLocaleString()})`);
        });
      }
    }

    console.log('\n🎉 Reminder system test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Monitor the admin dashboard at /admin/reminders');
    console.log('   2. Check logs for automatic processing every 10 minutes');
    console.log('   3. Verify emails are sent according to schedule');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testReminderSystem().catch(console.error);