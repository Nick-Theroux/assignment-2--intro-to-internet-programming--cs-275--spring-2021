const {src, dest, watch, series} = require('gulp');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const htmlValidator = require('gulp-html') //There seems to be an issue with my gulp-html module issue was looked intp but not fixed
const htmlCompressor = require('gulp-htmlmin');
const cssLinter = require('gulp-stylelint'); //There seems to be an issue with my gulp-stylelint module issue was not fixed
const jsLinter = require('gulp-eslint'); //There seems to be an issue with my gulp-eslint module issue was not fixed
const browserSync = require('browser-sync');
const jsCompressor = require('gulp-uglify');
const reload = browserSync.reload;

//Browsers
async function edge (){
    browserChoice = "mircrosoft-edge";
};

async function chrome (){
    browserChoice = "chrome";
};

async function allbrowsers(){
    browserChoice["mircrosoft-edge", "chrome"]
};

let validateHTML = () => {
    return src('dev/*.html')
        .pipe(htmlValidator) //error seems to occur here couses problems with the serve task
};

let compressHTML = () => {
    return src('dev/*.html')
        .pipe(htmlCompressor({collapseWhitespace: true}))
        .pipe(dest('prod/'));
};

let lintCSS = () => {
    return src('dev/css/*.css')
        .pipe(cssLinter({
            failAfterError: true,
            reporters: [
                {formatter: 'verbose', console: true}
            ]
        }));
};

let compileCSSForProd = () => {
    return src('dev/css/style.css')
        .pipe(sass({
            outputStyle: 'compressed',
            precision: 10
        }).on('error', sass.logError))
        .pipe(dest('prod/css'));
};

let lintJS = () => {
    return src('dev/js/*.js')
        .pipe(jsLinter({ //Does not work due to issue with node module
            parserOptions: {
               ecmaVersion: 2017,
                sourceType: 'module'
            },
            rules:{
                indent: [2, 4, {SwitchCase: 1}],
                quotes: [2, 'backtick'],
                semi:   [2,'always'],
                'linebreakstyle': [2, 'unix'],
                'max-len': [1, 85, 4]
            },
            env: {
                es6: true,
                node: true,
                browser: true
            },
            extends: 'esLint:recommended'
        }))
       .pipe(jsLinter.formatEach('compact', process.stderr));
};

let transpileJSForProd = () => {
    return src('dev/js/*.js')
        .pipe(babel())
        .pipe(jsCompressor())
        .pipe(dest('prod/js'));
};

let serve = () => {
    browserSync.init({
        notify: true,
        reloadDelay: 1,
        browser: browserChoice,
        server: {
            baseDir:'dev'
        }
    })

watch('dev/js/*.js',
    series(lintJS)
    ).on('change', reload);

watch('dev/css/**/*.scss',
   series(lintCSS)
    ).on('change', reload);
watch('dev/**/*.html',
    ).on('change', reload);
};

async function clean() {
    let fs = require('fs'),
        i,
        foldersToDelete = ['./temp','prod'];

    for (i = 0; i<foldersToDelete.length; i++){
        try{
            fs.accessSync(foldersToDelete[i],fs.F_OK);
            process.stdout.write('\n\tThe ' + foldersToDelete[i] + 'directory was not found and will be deleted.\n')
            del(foldersToDelete[i]);    
        } catch (e) {
            process.stdout.write('\n\tThe ' + foldersToDelete[i] + ' directory does not exist or is NOT accessible.\n')
        }
    }
    process.stdout.write('\n')
}

exports.clean = clean
exports.validateHTML = validateHTML;
exports.compressHTML = compressHTML;
exports.lintCSS = lintCSS
exports.build = series(
    compressHTML,
    compileCSSForProd,
    transpileJSForProd
);
exports.serve = series(validateHTML, compressHTML, lintCSS, jsLinter)