const pathToRepo = path.join(execEnv.tempDir, 'repo');
const pathToDistribution = path.join(pathToRepo, 'dist');
const pathToArchive = path.join(execEnv.tempDir, 'archive.tgz');

child_process.execFileSync('git', ['clone', 'https://github.com/martinjlowm/ts-auto-mock.git', pathToRepo]);

child_process.execFileSync('git', ['checkout', 'release/v2.0.0-martinjlowm'], { cwd: pathToRepo });
child_process.execFileSync('npm', ['ci'], { cwd: pathToRepo });

child_process.execFileSync('npm', ['run', 'build'], { cwd: pathToRepo });
child_process.execFileSync('npm', ['run', 'package'], { cwd: pathToRepo });

// Delete the package.json such that it doesn't confuse Yarn thinking it's
// related to the one in the dist directory
child_process.execFileSync('rm', ['package.json'], { cwd: pathToRepo });

child_process.execFileSync('yarn', ['pack', '--out', pathToArchive], { cwd: pathToDistribution });
child_process.execFileSync('tar', ['-x', '-z', '--strip-components=1', '-f', pathToArchive, '-C', execEnv.buildDir]);
