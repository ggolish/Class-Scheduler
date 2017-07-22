<?php 

$dir = $_POST['dir'];
$user = $_SERVER['REMOTE_USER'];
$dir = $user . '-' . $dir;

if(!empty($dir) && file_exists("Saved/$dir")) {
  array_map('unlink', glob("Saved/$dir/*.*"));
  rmdir("Saved/$dir");
  echo $dir . " removed";
} else {
  echo $dir . " not removed";
}

?>