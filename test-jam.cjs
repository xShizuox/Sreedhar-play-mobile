const { io } = require('socket.io-client');

async function testJam() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║        SREEDHAR PLAY — JAM FUNCTIONALITY TEST     ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    const JAM_ID = 'test-jam-' + Date.now();
    const HOST_USER = { id: 'host-1', username: 'TestHost' };
    const LISTENER_USER = { id: 'listener-1', username: 'Listener1' };

    const hostSocket = io('http://localhost:3000', { transports: ['websocket'] });
    const listenerSocket = io('http://localhost:3000', { transports: ['websocket'] });

    let testsPassed = 0;
    let testsFailed = 0;

    function pass(label, ok) {
        if (ok) {
            console.log(`  ✅ PASS  [${label}]`);
            testsPassed++;
        } else {
            console.log(`  ❌ FAIL  [${label}]`);
            testsFailed++;
        }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Host creates/joins session
    hostSocket.emit('join-jam', { jamId: JAM_ID, user: HOST_USER });
    
    let hostStateUpdated = false;
    let jamState = null;
    hostSocket.on('jam-update', (state) => {
        jamState = state;
        if (state.hostId === HOST_USER.id) hostStateUpdated = true;
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    pass('Host creates and joins Jam session', hostStateUpdated && jamState.members.length === 1);

    // Test 2: Listener joins
    listenerSocket.emit('join-jam', { jamId: JAM_ID, user: LISTENER_USER });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    pass('Listener joins Jam session', jamState.members.length === 2);

    // Test 3: Host adds track to queue
    hostSocket.emit('add-to-queue', { jamId: JAM_ID, track: { id: 'track-1', title: 'Test Track' } });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    pass('Adding first track to queue automatically starts it', jamState.currentTrack?.id === 'track-1' && jamState.isPlaying === true);

    // Test 4: Host syncs playback state to listeners
    let listenerSyncReceived = false;
    listenerSocket.on('jam-sync', (state) => {
        if (state.progress === 15 && state.isPlaying === true) {
            listenerSyncReceived = true;
        }
    });

    hostSocket.emit('player-state-change', { 
        jamId: JAM_ID, 
        state: { isPlaying: true, progress: 15 } 
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    pass('Host playback progress syncs to listeners', listenerSyncReceived);

    // Test 5: Host leaves -> listener becomes new host
    let lisState = null;
    listenerSocket.on('jam-update', (s) => lisState = s);
    hostSocket.emit('leave-jam', { jamId: JAM_ID, userId: HOST_USER.id });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    pass('Host leaves -> Listener automatically promoted to Host', lisState?.hostId === LISTENER_USER.id && lisState?.members?.length === 1);

    hostSocket.disconnect();
    listenerSocket.disconnect();

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log(`║  RESULT: ${testsPassed}/${testsPassed+testsFailed} PASSED   ${testsFailed} FAILED                            ║`);
    console.log('╚═══════════════════════════════════════════════════╝\n');
}

testJam().catch(console.error);
