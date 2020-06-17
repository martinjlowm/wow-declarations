const pathToRepo = path.join(execEnv.tempDir, 'repo');
const pathToArchive = path.join(execEnv.tempDir, 'archive.tgz');
const pathToDistribution = path.join(pathToRepo, 'dist');

child_process.execFileSync('git', ['clone', 'https://github.com/martinjlowm/ts-auto-mock.git', pathToRepo]);

child_process.execFileSync('git', ['checkout', 'release/v2.0.0-martinjlowm'], { cwd: pathToRepo });
child_process.execFileSync('npm', ['ci'], { cwd: pathToRepo });

child_process.execFileSync('npm', ['run', 'build'], { cwd: pathToRepo });
child_process.execFileSync('npm', ['run', 'package'], { cwd: pathToRepo });

child_process.execFileSync('rmdir', [execEnv.buildDir]);
child_process.execFileSync('mv', [pathToDistribution, execEnv.buildDir]);
