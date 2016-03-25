import com.github.play2war.plugin._

name := "bayes-viewer"

version := "1.0-SNAPSHOT"

Play2WarPlugin.play2WarSettings

Play2WarKeys.servletVersion := "3.0"

lazy val root = (project in file(".")).enablePlugins(PlayJava)

scalaVersion := "2.11.1"

libraryDependencies ++= Seq(
  javaJdbc,
  javaEbean,
  cache,
  javaWs
)

libraryDependencies += "com.google.code.gson" % "gson" % "2.3.1"

libraryDependencies += "mysql" % "mysql-connector-java" % "5.1.34"

libraryDependencies += filters

libraryDependencies += "commons-codec" %  "commons-codec" % "1.10"

// libraryDependencies += evolutions //this one didn't work // evolution setting in application.conf file


