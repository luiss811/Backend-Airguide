const scanner = require('sonarqube-scanner').default;

scanner(
    {
        serverUrl: 'http://localhost:9000',
        token: 'sqp_3ef4e2d8873adc0d1ac8d21f7fdc6536470cd692',
        options: {
            'sonar.projectKey': 'AirGuide',
            'sonar.projectName': 'AirGuide',
            'sonar.sources': 'src',
            'sonar.exclusions': 'node_modules/**, dist/**, **/*.test.ts, src/prisma/seed.ts'
        }
    },
    () => {
        console.log('¡Escaneo terminado con éxito!');
        process.exit();
    }
);
