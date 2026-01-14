#!/bin/bash

echo
echo "======================================"
echo "   3Dwork Klipper Log Packager"
echo "======================================"
echo

# Detect printer_data location or use defaults
data=${1:-printer_data}
if [ -d "${HOME}/${data}" ]; then
  config_dir="${HOME}/${data}/config"
  logs_dir="${HOME}/${data}/logs"
else
  # Fallback to older locations
  config_dir="${HOME}/klipper_config"
  logs_dir="${HOME}/klipper_logs"
  [ ! -d "$config_dir" ] && config_dir="${HOME}"
  [ ! -d "$logs_dir" ] && logs_dir="${HOME}/logs"
fi

if [ ! -d "$logs_dir" ]; then
  echo "Error: Klipper logs directory not found."
  echo "Tried: ${HOME}/${data}/logs"
  exit 1
fi

echo "Found config at: $config_dir"
echo "Found logs at: $logs_dir"

# Temporary file for system info
debug_file="${logs_dir}/debug_info.txt"
dmesg_file="${logs_dir}/dmesg.txt"

echo "Collecting system diagnostics..."

# Helper to run command and log to debug file
run_diag() {
    echo ">>> $1" >> "${debug_file}"
    $1 >> "${debug_file}" 2>&1
    echo "" >> "${debug_file}"
}

rm -f "${debug_file}"
touch "${debug_file}"

run_diag "lsb_release -a"
run_diag "uname -a"
run_diag "id"
run_diag "find /dev/serial"
run_diag "find /dev/v4l"
run_diag "free -h"
run_diag "df -h"
run_diag "lsusb"
run_diag "ip -4 a"
run_diag "ip --details --statistics link show dev can0"
run_diag "systemctl status klipper"
run_diag "systemctl status moonraker"
run_diag "systemctl status KlipperScreen"

# Collect dmesg
echo "Collecting kernel logs (dmesg)..."
sudo dmesg -T > "${dmesg_file}" 2>/dev/null || dmesg > "${dmesg_file}"

# Files to include in the package
tar_file="klipper_logs_$(date +%Y%m%d_%H%M%S).tar.gz"
files_to_zip=("klippy.log" "moonraker.log" "dmesg.txt" "debug_info.txt")

# Optionally include printer.cfg if found
if [ -f "${config_dir}/printer.cfg" ]; then
    cp "${config_dir}/printer.cfg" "${logs_dir}/printer.cfg"
    files_to_zip+=("printer.cfg")
fi

# Check for additional logs
[ -f "${logs_dir}/crowsnest.log" ] && files_to_zip+=("crowsnest.log")
[ -f "${logs_dir}/telegram.log" ] && files_to_zip+=("telegram.log")

echo "Compressing logs and configuration..."
cd "${logs_dir}"
tar -czf "${tar_file}" "${files_to_zip[@]}"

# Cleanup temporary copy
[ -f "${logs_dir}/printer.cfg" ] && rm "${logs_dir}/printer.cfg"

echo
echo "======================================"
echo "SUCCESS!"
echo "Log package created: ${logs_dir}/${tar_file}"
echo "======================================"
echo "1. Download this file from your printer (via Mainsail/Fluidd file manager or SCP)"
echo "2. Upload it to the 3Dwork Log Analyzer tool."
echo "======================================"
