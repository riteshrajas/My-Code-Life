// Test script for Agentic AI functionality
// This script tests the core agentic service functionality

import { agenticService, AgenticAction } from '../src/lib/agenticService';

// Test actions
const testActions: AgenticAction[] = [
  // Test theme change
  {
    type: 'action',
    content: 'Testing theme change to dark mode',
    action: {
      actionType: 'CHANGE_THEME',
      parameters: {
        theme: 'dark'
      },
      confirmationRequired: false
    }
  },
  
  // Test task creation
  {
    type: 'action',
    content: 'Testing task creation',
    action: {
      actionType: 'CREATE_TASK',
      parameters: {
        title: 'Test Task',
        description: 'This is a test task created by the agentic AI',
        priority: 'medium',
        ruleAlignment: 2
      },
      confirmationRequired: false
    }
  },
  
  // Test habit creation
  {
    type: 'action',
    content: 'Testing habit creation',
    action: {
      actionType: 'CREATE_HABIT',
      parameters: {
        title: 'Daily Reading',
        description: 'Read for 30 minutes every day',
        category: 'Learning',
        frequency: 'daily',
        targetCount: 1,
        color: '#4F46E5',
        ruleAlignment: 1
      },
      confirmationRequired: false
    }
  },
  
  // Test navigation
  {
    type: 'action',
    content: 'Testing navigation',
    action: {
      actionType: 'NAVIGATE_TO_PAGE',
      parameters: {
        page: 'tasks'
      },
      confirmationRequired: false
    }
  }
];

// Function to run tests
async function runAgenticTests() {
  console.log('🤖 Running Agentic AI Tests...\n');
  
  for (let i = 0; i < testActions.length; i++) {
    const action = testActions[i];
    console.log(`Test ${i + 1}: ${action.content}`);
    
    try {
      const result = await agenticService.executeAction(action);
      
      if (result.success) {
        console.log(`✅ Success: ${result.message}`);
      } else {
        console.log(`❌ Failed: ${result.message}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.log(`💥 Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 All tests completed!');
  
  // Show action history
  const history = agenticService.getActionHistory();
  console.log(`\n📊 Total actions executed: ${history.length}`);
}

// Export for use in development
export { runAgenticTests, testActions };

// Example usage comments:
/*
To test in the browser console:
1. Open the app in development mode
2. Open browser dev tools
3. Import and run: 
   import { runAgenticTests } from './tests/agentic-test.js';
   runAgenticTests();
*/
