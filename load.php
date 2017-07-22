<?php 

$dir = $_REQUEST['dir'];
$name = $_REQUEST['name'];
$user = $_SERVER['REMOTE_USER'];
$dir = $user . '-' . $dir;
$path = "Saved/" . $dir . "/" . $name . ".txt";

if(!empty($dir) && !empty($name) && file_exists($path)) {
  $fd = fopen($path, "r");
  echo fgets($fd);
  fclose($fd);
} else {
  echo json_encode(null);
}

?>