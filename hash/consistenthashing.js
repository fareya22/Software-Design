const crypto = require("crypto");
const readline = require("readline");

class ConsistentHashing {
    constructor(virtualNodes = 5) {
        this.ring = new Map(); 
        this.virtualNodes = virtualNodes; 
        this.servers = new Set(); 
    }

    hash(value) {
        return parseInt(crypto.createHash("sha1").update(value).digest("hex").slice(0, 8), 16);
    }

    addServer(server) {
        this.servers.add(server);
        for (let i = 0; i < this.virtualNodes; i++) {
            const virtualNodeKey = `${server}#${i}`;
            const hash = this.hash(virtualNodeKey);
            this.ring.set(hash, server);
        }
        this._rebuildRing();
    }

    removeServer(server) {
        this.servers.delete(server);
        for (let i = 0; i < this.virtualNodes; i++) {
            const virtualNodeKey = `${server}#${i}`;
            const hash = this.hash(virtualNodeKey);
            this.ring.delete(hash);
        }
        this._rebuildRing();
    }

    getServer(key) {
        const hash = this.hash(key);
        const keys = Array.from(this.ring.keys()).sort((a, b) => a - b);

        for (const k of keys) {
            if (hash <= k) {
                return this.ring.get(k);
            }
        }
        return this.ring.get(keys[0]); 
    }

    _rebuildRing() {
        const sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
        this.ring = new Map(sortedKeys.map(key => [key, this.ring.get(key)]));
    }

    displayRing() {
        console.log("Hash Ring:", [...this.ring.entries()]);
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const consistentHash = new ConsistentHashing(3); 


function addServer() {
    rl.question("Enter server name to add: ", (server) => {
        consistentHash.addServer(server);
        console.log(`Server ${server} added.`);
        consistentHash.displayRing();
        askForAction();
    });
}

function removeServer() {
    rl.question("Enter server name to remove: ", (server) => {
        consistentHash.removeServer(server);
        console.log(`Server ${server} removed.`);
        consistentHash.displayRing();
        askForAction();
    });
}


function addKey() {
    rl.question("Enter key to add: ", (key) => {
        console.log(`Key: ${key}, Assigned Server: ${consistentHash.getServer(key)}`);
        askForAction();
    });
}


function getKeyAssignment() {
    rl.question("Enter key to get assigned server: ", (key) => {
        console.log(`Key: ${key}, Assigned Server: ${consistentHash.getServer(key)}`);
        askForAction();
    });
}

function askForAction() {
    rl.question("\nChoose an action:\n1. Add Server\n2. Remove Server\n3. Add Key\n4. Get Key Assignment\n5. Exit\n", (choice) => {
        switch(choice) {
            case '1':
                addServer();
                break;
            case '2':
                removeServer();
                break;
            case '3':
                addKey();
                break;
            case '4':
                getKeyAssignment();
                break;
            case '5':
                rl.close();
                break;
            default:
                console.log("Invalid choice. Please try again.");
                askForAction();
                break;
        }
    });
}


askForAction();
