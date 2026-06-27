@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"
set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

if not exist "%WRAPPER_JAR%" (
  echo Couldn't find %WRAPPER_JAR%
  exit /B 1
)

where java >nul 2>&1
if ERRORLEVEL 1 (
  echo ERROR: java not found in PATH. Install JDK 17+.
  exit /B 1
)

java -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
exit /B %ERRORLEVEL%
