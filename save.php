<?php 

$dir = $_POST['dir'];
$name = $_POST['name'];
$data = $_POST['data'];
$user = $_SERVER['REMOTE_USER'];
$dir2 = $user . '-' . $dir;
$path = "Saved/" . $dir2 . "/" . $name . ".txt";

if(!empty($dir) && !empty($name) && !empty($data)) {
  if(!file_exists("Saved/$dir2")) mkdir("Saved/$dir2", 0777);
  $fd = fopen($path, "w");
  fwrite($fd, $data);
  fclose($fd);
  echo "Saved: " . $path;
} else {
  echo "Save Failed: " . $path;
}

?>
