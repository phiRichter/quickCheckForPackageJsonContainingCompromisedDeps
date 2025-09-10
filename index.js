import fs from 'node:fs';
import path from 'node:path';

const compromisedPackages = [
	'ansi-styles@6.2.2',
	'debug@4.4.2',
	'chalk@5.6.1',
	'supports-color@10.2.1',
	'strip-ansi@7.1.1',
	'ansi-regex@6.2.1',
	'wrap-ansi@9.0.1',
	'color-convert@3.1.1',
	'color-name@2.0.1',
	'is-arrayish@0.3.3',
	'slice-ansi@7.1.1',
	'color@5.0.1',
	'color-string@2.1.1',
	'simple-swizzle@0.2.3',
	'supports-hyperlinks@4.1.1',
	'has-ansi@6.0.1',
	'chalk-template@1.1.1',
	'backslash@0.2.1',
	'@coveops/abi@2.0.1',
	'@duckdb/duckdb-wasm@1.29.2',
	'@duckdb/node-api@1.3.3',
	'@duckdb/node-bindings@1.3.3',
	'duckdb@1.3.3',
	'prebid@10.9.1',
	'prebid@10.9.2',
	'error-ex@1.3.3',
];

function findPackageLocks(dir, results = []) {
	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				findPackageLocks(fullPath, results);
			} else if (entry.name === 'package-lock.json') {
				results.push(fullPath);
			}
		}
	} catch (err) {
		// console.log(err) i only get spammed by permissions here since windows doesnt like it
	}
	return results;
}
console.log('Searching all package-lock.json files');
const rootDir = process.platform === 'win32' ? 'C:\\' : '/'; // i hope / works for mac since i dont have a mac

const locks = findPackageLocks(rootDir);
console.log('Found package-lock.json files:', locks);
const compromisedDeps = [];

locks.forEach((filePath) => {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		const json = JSON.parse(content);
		const deps = new Set();

		// produce same string as in the list
		function collectDeps(obj) {
			if (!obj || typeof obj !== 'object') return;
			for (const [name, data] of Object.entries(obj)) {
				if (data.version) {
					deps.add(`${name}@${data.version}`);
				}
				if (data.dependencies) {
					collectDeps(data.dependencies);
				}
			}
		}

		if (json.dependencies) {
			collectDeps(json.dependencies);
		}

		// Check if containds compromised
		const hits = compromisedPackages.filter((pkg) => deps.has(pkg));
		if (hits.length > 0) {
			console.log(`Found compromised packages in ${filePath}:`, hits);
			compromisedDeps.push({ filePath, hits });
		}
	} catch (err) {
		console.error('Error reading', filePath);
	}
});

console.log('\n\n');

if (compromisedDeps.length > 0) {
	compromisedDeps.forEach(({ filePath, hits }) => console.log(filePath, hits.join(',\n')));
} else {
	console.log(`No Compromised Entrys found in ${locks.length} files`);
}
