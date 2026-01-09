import type { Strategy } from './types';

// NOTE: Coordinates here are placeholders! 
// In a real scenario, we'd use the SidePanel DevTools to find real coords on the Mock Page.
// For the purpose of "Phase 2/3 Verification", the user will likely need to adjust these 
// or we make the mock page very predictable (top-left aligned).

export const STRATEGY_MOCK_TPA_CHECK: Strategy = {
    id: 'mock-tpa-check',
    name: 'Mock TPA Eligibility Check',
    description: 'Opens Mock TPA, Logs in, and Checks Eligibility key',
    steps: [
        {
            id: 'open-tpa',
            action: 'GOTO',
            params: { url: 'chrome-extension://__MSG_@@extension_id__/mocks/tpa.html' }
        },
        {
            id: 'wait-load',
            action: 'WAIT',
            params: { timeout: 1000 }
        },
        {
            id: 'click-login',
            action: 'CLICK',
            params: { x: 220, y: 350 }
        },
        {
            id: 'wait-login',
            action: 'WAIT',
            params: { timeout: 500 }
        },
        {
            id: 'type-code',
            action: 'TYPE',
            params: { text: 'CL-TEST-001' }
        }
    ]
};

export const STRATEGY_BROKEN_TEST: Strategy = {
    id: 'broken-test',
    name: 'Healing Test (Broken Selector)',
    description: 'Uses wrong selector to force AI Healing',
    steps: [
        {
            id: 'open-tpa',
            action: 'GOTO',
            params: { url: 'chrome-extension://__MSG_@@extension_id__/mocks/tpa.html' }
        },
        {
            id: 'wait-load',
            action: 'WAIT',
            params: { timeout: 1000 }
        },
        {
            id: 'click-login-broken',
            action: 'CLICK',
            params: {
                selector: '#non-existent-id',
                description: 'Login Button',
            }
        },
        {
            id: 'wait-login',
            action: 'WAIT',
            params: { timeout: 500 }
        },
        {
            id: 'type-code',
            action: 'TYPE',
            params: { text: 'HEALING-SUCCESS' }
        }
    ]
};

// --- Phase 6: Clinical Bridge Strategies ---

export const STRATEGY_EXTRACT_CMS: Strategy = {
    id: 'extract-cms',
    name: 'Extract Patient Data (CMS)',
    description: 'Reads patient Name and NRIC from current CMS page',
    steps: [
        // No GOTO: We execute on the ACTIVE tab provided by SidePanel
        {
            id: 'read-name',
            action: 'READ',
            params: { selector: '#extracted-name' }
        },
        {
            id: 'read-nric',
            action: 'READ',
            params: { selector: '#extracted-nric' }
        }
    ]
};

export const STRATEGY_TPA_PARALLEL_1: Strategy = {
    id: 'tpa-parallel-1',
    name: 'TPA 1 (Fullerton)',
    description: 'Checks eligibility on Fullerton Health Mock',
    steps: [
        {
            id: 'open-tpa1',
            action: 'GOTO',
            params: { url: 'chrome-extension://__MSG_@@extension_id__/mocks/tpa_fullerton.html' }
        },
        {
            id: 'wait-load',
            action: 'WAIT',
            params: { timeout: 1000 }
        },
        // Focus Input first
        {
            id: 'focus-nric-1',
            action: 'CLICK',
            params: { selector: '#nricInput', description: 'NRIC Field' }
        },
        {
            id: 'type-nric-1',
            action: 'TYPE',
            params: { text: '{{nric}}' }
        },
        {
            id: 'click-search',
            action: 'CLICK',
            params: { selector: '.btn-submit', description: 'Search Database Button' }
        }
    ]
};

export const STRATEGY_TPA_PARALLEL_2: Strategy = {
    id: 'tpa-parallel-2',
    name: 'TPA 2 (Doctor Anywhere)',
    description: 'Checks GL Status on DA Mock using extracted NRIC',
    steps: [
        {
            id: 'open-tpa2',
            action: 'GOTO',
            params: { url: 'chrome-extension://__MSG_@@extension_id__/mocks/tpa_da_flow.html' }
        },
        {
            id: 'wait-load-2',
            action: 'WAIT',
            params: { timeout: 1000 }
        },
        // Focus NRIC Field
        {
            id: 'focus-nric-2',
            action: 'CLICK',
            params: { selector: '#nric-input', description: 'NRIC Field' }
        },
        {
            id: 'type-nric-2',
            action: 'TYPE',
            params: { text: '{{nric}}' }
        },
        {
            id: 'check-status',
            action: 'CLICK',
            params: { selector: '#verify-btn', description: 'Verify Button' }
        }
    ]
};

export const STRATEGIES = [
    STRATEGY_MOCK_TPA_CHECK,
    STRATEGY_BROKEN_TEST,
    STRATEGY_EXTRACT_CMS,
    STRATEGY_TPA_PARALLEL_1,
    STRATEGY_TPA_PARALLEL_2,
    {
        id: 'live-web-demo',
        name: 'Live Web Demo (HerokuApp)',
        description: 'Demonstrates automation on a real public website (the-internet.herokuapp.com)',
        steps: [
            {
                id: 'open-live',
                action: 'GOTO',
                params: { url: 'https://the-internet.herokuapp.com/login' }
            },
            {
                id: 'wait-live',
                action: 'WAIT',
                params: { timeout: 2000 }
            },
            {
                id: 'click-user',
                action: 'CLICK',
                params: { selector: '#username', description: 'Username Field' }
            },
            {
                id: 'type-user',
                action: 'TYPE',
                params: { text: 'tomsmith' }
            },
            {
                id: 'click-pass',
                action: 'CLICK',
                params: { selector: '#password', description: 'Password Field' }
            },
            {
                id: 'type-pass',
                action: 'TYPE',
                params: { text: 'SuperSecretPassword!' }
            },
            {
                id: 'submit-login',
                action: 'CLICK',
                params: { selector: 'button[type="submit"]', description: 'Login Button' }
            }
        ]
    }
];
