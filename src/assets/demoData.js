window.demoLogData = {    klippy: `Starting Klippy...
Starting Klippy...
Args: ['/home/luis/klipper/klippy/klippy.py', '/home/luis/printer_data/config/printer.cfg', '-l', '/home/luis/printer_data/logs/klippy.log', '-I', '/home/luis/printer_data/comms/klippy.serial', '-a', '/home/luis/printer_data/comms/klippy.sock']
Git version: 'v0.13.0-320-gc80324946'
Branch: master
Remote: origin
Tracked URL: https://github.com/Klipper3d/klipper.git
CPU: 4 core ?
Device: Raspberry Pi 3 Model B Plus Rev 1.3
Linux: Linux version 6.12.47+rpt-rpi-v8 (serge@raspberrypi.com) (aarch64-linux-gnu-gcc-12 (Debian 12.2.0-14+deb12u1) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT Debian 1:6.12.47-1+rpt1~bookworm (2025-09-16)
Python: '3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]'
Building C code module c_helper.so
Start printer at Thu Jan  8 03:12:51 2026 (1767841971.5 135.0)
Unable to open config file /home/luis/printer_data/config/printer.cfg
Traceback (most recent call last):
  File "/home/luis/klipper/klippy/configfile.py", line 150, in read_config_file
    f = open(filename, 'r')
        ^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: '/home/luis/printer_data/config/printer.cfg'
Config error
Traceback (most recent call last):
  File "/home/luis/klipper/klippy/configfile.py", line 150, in read_config_file
    f = open(filename, 'r')
        ^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: '/home/luis/printer_data/config/printer.cfg'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/luis/klipper/klippy/klippy.py", line 130, in _connect
    self._read_config()
  File "/home/luis/klipper/klippy/klippy.py", line 116, in _read_config
    config = pconfig.read_main_config()
             ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klipper/klippy/configfile.py", line 483, in read_main_config
    fileconfig, autosave_fileconfig = self.autosave.load_main_config()
                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klipper/klippy/configfile.py", line 304, in load_main_config
    data = cfgrdr.read_config_file(filename)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klipper/klippy/configfile.py", line 156, in read_config_file
    raise error(msg)
configparser.Error: Unable to open config file /home/luis/printer_data/config/printer.cfg
webhooks client 548223624464: New connection
webhooks client 548223624464: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
webhooks client 548223624464: Disconnected
Restarting printer
Start printer at Thu Jan  8 03:18:32 2026 (1767842312.4 475.9)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if last_extruder_temp.restore %}
	
	RESPOND TYPE=echo MSG='{"Restoring \\"%s\\" temperature to %3.1f\\u00B0C, this may take some time" % (printer.toolhead.extruder, last_extruder_temp.temp) }'
	M109 S{last_extruder_temp.temp}
	{% set do_resume = True %}
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	{% if runout_resume %}
	{% if do_resume %}
	{% if restore_idle_timeout > 0 %} SET_IDLE_TIMEOUT TIMEOUT={restore_idle_timeout} {% endif %}
	{client.user_resume_macro|default("")}
	_CLIENT_EXTRUDE
	RESUME_BASE VELOCITY={params.VELOCITY|default(sp_move)}
	{% endif %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]}'
	{% set _d = prompt_txt.append("\\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]) %}
	{% endif %}
	
	{% if not (runout_resume and do_resume) %}
	RESPOND TYPE=command MSG="action:prompt_begin RESUME aborted !!!"
	{% for element in prompt_txt %}
	RESPOND TYPE=command MSG='{"action:prompt_text %s" % element}'
	{% endfor %}
	RESPOND TYPE=command MSG="action:prompt_footer_button Ok|RESPOND TYPE=command MSG=action:prompt_end|info"
	RESPOND TYPE=command MSG="action:prompt_show"
	{% endif %}

[gcode_macro SET_PAUSE_NEXT_LAYER]
description = Enable a pause if the next layer is reached
gcode = 
	{% set pause_next_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_next_layer %}
	{% set ENABLE = params.ENABLE|default(1)|int != 0 %}
	{% set MACRO = params.MACRO|default(pause_next_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_next_layer VALUE="{{ 'enable': ENABLE, 'call': MACRO }}"

[gcode_macro SET_PAUSE_AT_LAYER]
description = Enable/disable a pause if a given layer number is reached
gcode = 
	{% set pause_at_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_at_layer %}
	{% set ENABLE = params.ENABLE|int != 0 if params.ENABLE is defined
	else params.LAYER is defined %}
	{% set LAYER = params.LAYER|default(pause_at_layer.layer)|int %}
	{% set MACRO = params.MACRO|default(pause_at_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_at_layer VALUE="{{ 'enable': ENABLE, 'layer': LAYER, 'call': MACRO }}"

[gcode_macro SET_PRINT_STATS_INFO]
rename_existing = SET_PRINT_STATS_INFO_BASE
description = Overwrite, to get pause_next_layer and pause_at_layer feature
variable_pause_next_layer = { 'enable': False, 'call': "PAUSE" }
variable_pause_at_layer = { 'enable': False, 'layer': 0, 'call': "PAUSE" }
gcode = 
	{% if pause_next_layer.enable %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_next_layer" % pause_next_layer.call}'
	{pause_next_layer.call}
	SET_PAUSE_NEXT_LAYER ENABLE=0
	{% elif pause_at_layer.enable and params.CURRENT_LAYER is defined and params.CURRENT_LAYER|int == pause_at_layer.layer %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_at_layer [%d]" % (pause_at_layer.call, pause_at_layer.layer)}'
	{pause_at_layer.call}
	SET_PAUSE_AT_LAYER ENABLE=0
	{% endif %}
	SET_PRINT_STATS_INFO_BASE {rawparams}

[gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL]
description = Helper: park toolhead used in PAUSE and CANCEL_PRINT
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set use_custom     = client.use_custom_pos|default(false)|lower == 'true' %}
	{% set custom_park_x  = client.custom_park_x|default(0.0) %}
	{% set custom_park_y  = client.custom_park_y|default(0.0) %}
	{% set park_dz        = client.custom_park_dz|default(2.0)|abs %}
	{% set sp_hop         = client.speed_hop|default(15) * 60 %}
	{% set sp_move        = client.speed_move|default(velocity) * 60 %}
	
	{% set origin    = printer.gcode_move.homing_origin %}
	{% set act       = printer.gcode_move.gcode_position %}
	{% set max       = printer.toolhead.axis_maximum %}
	{% set cone      = printer.toolhead.cone_start_z|default(max.z) %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	
	{% set z_min = params.Z_MIN|default(0)|float %}
	{% set z_park = [[(act.z + park_dz), z_min]|max, (max.z - origin.z)]|min %}
	{% set x_park = params.X       if params.X is defined
	else custom_park_x  if use_custom
	else 0.0            if round_bed
	else (max.x - 5.0) %}
	{% set y_park = params.Y       if params.Y is defined
	else custom_park_y  if use_custom
	else (max.y - 5.0)  if round_bed and z_park < cone
	else 0.0            if round_bed
	else (max.y - 5.0) %}
	
	_CLIENT_RETRACT
	{% if "xyz" in printer.toolhead.homed_axes %}
	G90
	G1 Z{z_park} F{sp_hop}
	G1 X{x_park} Y{y_park} F{sp_move}
	{% if not printer.gcode_move.absolute_coordinates %} G91 {% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='Printer not homed'
	{% endif %}

[gcode_macro _CLIENT_EXTRUDE]
description = Extrudes, if the extruder is hot enough
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set use_fw_retract = (client.use_fw_retract|default(false)|lower == 'true') and (printer.firmware_retraction is defined) %}
	{% set length = params.LENGTH|default(client.unretract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_unretract)|default(35) %}
	{% set absolute_extrude = printer.gcode_move.absolute_extrude %}
	
	{% if printer.toolhead.extruder != '' %}
	{% if printer[printer.toolhead.extruder].can_extrude %}
	{% if use_fw_retract %}
	{% if length < 0 %}
	G10
	{% else %}
	G11
	{% endif %}
	{% else %}
	M83
	G1 E{length} F{(speed|float|abs) * 60}
	{% if absolute_extrude %}
	M82
	{% endif %}
	{% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='{"\\"%s\\" not hot enough" % printer.toolhead.extruder}'
	{% endif %}
	{% endif %}

[gcode_macro _CLIENT_RETRACT]
description = Retracts, if the extruder is hot enough
gcode = 
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set length = params.LENGTH|default(client.retract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_retract)|default(35) %}
	
	_CLIENT_EXTRUDE LENGTH=-{length|float|abs} SPEED={speed|float|abs}

[gcode_macro _CLIENT_LINEAR_MOVE]
description = Linear move with save and restore of the gcode state
gcode = 
	{% set x_move = "X" ~ params.X if params.X is defined else "" %}
	{% set y_move = "Y" ~ params.Y if params.Y is defined else "" %}
	{% set z_move = "Z" ~ params.Z if params.Z is defined else "" %}
	{% set e_move = "E" ~ params.E if params.E is defined else "" %}
	{% set rate = "F" ~ params.F if params.F is defined else "" %}
	{% set ABSOLUTE = params.ABSOLUTE | default(0) | int != 0 %}
	{% set ABSOLUTE_E = params.ABSOLUTE_E | default(0) | int != 0 %}
	SAVE_GCODE_STATE NAME=_client_movement
	{% if x_move or y_move or z_move %}
	G9{ 0 if ABSOLUTE else 1 }
	{% endif %}
	{% if e_move %}
	M8{ 2 if ABSOLUTE_E else 3 }
	{% endif %}
	G1 { x_move } { y_move } { z_move } { e_move } { rate }
	RESTORE_GCODE_STATE NAME=_client_movement

[gcode_macro GET_TIMELAPSE_SETUP]
description = Print the Timelapse setup
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set output_txt = ["Timelapse Setup:"] %}
	{% set _dummy = output_txt.append("enable: %s" % tl.enable) %}
	{% set _dummy = output_txt.append("park: %s" % tl.park.enable) %}
	{% if tl.park.enable %}
	{% set _dummy = output_txt.append("park position: %s time: %s s" % (tl.park.pos, tl.park.time)) %}
	{% set _dummy = output_txt.append("park cord x:%s y:%s dz:%s" % (tl.park.coord.x, tl.park.coord.y, tl.park.coord.dz)) %}
	{% set _dummy = output_txt.append("travel speed: %s mm/s" % tl.speed.travel) %}
	{% endif %}
	{% set _dummy = output_txt.append("fw_retract: %s" % tl.extruder.fw_retract) %}
	{% if not tl.extruder.fw_retract %}
	{% set _dummy = output_txt.append("retract: %s mm speed: %s mm/s" % (tl.extruder.retract, tl.speed.retract)) %}
	{% set _dummy = output_txt.append("extrude: %s mm speed: %s mm/s" % (tl.extruder.extrude, tl.speed.extrude)) %}
	{% endif %}
	{% set _dummy = output_txt.append("verbose: %s" % tl.verbose) %}
	{action_respond_info(output_txt|join("\\n"))}

[gcode_macro _SET_TIMELAPSE_SETUP]
description = Set user parameters for timelapse
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	{% set park = {'min'   : {'x': (min.x / 1.42)|round(3) if round_bed else min.x|round(3),
	'y': (min.y / 1.42)|round(3) if round_bed else min.y|round(3)},
	'max'   : {'x': (max.x / 1.42)|round(3) if round_bed else max.x|round(3),
	'y': (max.y / 1.42)|round(3) if round_bed else max.y|round(3)},
	'center': {'x': (max.x-(max.x-min.x)/2)|round(3),
	'y': (max.y-(max.y-min.y)/2)|round(3)}} %}
	
	{% if params.ENABLE %}
	{% if params.ENABLE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=enable VALUE={True if params.ENABLE|lower == 'true' else False}
	{% else %}
	{action_raise_error("ENABLE=%s not supported. Allowed values are [True, False]" % params.ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.VERBOSE %}
	{% if params.VERBOSE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=verbose VALUE={True if params.VERBOSE|lower == 'true' else False}
	{% else %}
	{action_raise_error("VERBOSE=%s not supported. Allowed values are [True, False]" % params.VERBOSE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_X %}
	{% if params.CUSTOM_POS_X|float >= min.x and params.CUSTOM_POS_X|float <= max.x %}
	{% set _dummy = tl.park.custom.update({'x':params.CUSTOM_POS_X|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_X=%s must be within [%s - %s]" % (params.CUSTOM_POS_X, min.x, max.x))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_Y %}
	{% if params.CUSTOM_POS_Y|float >= min.y and params.CUSTOM_POS_Y|float <= max.y %}
	{% set _dummy = tl.park.custom.update({'y':params.CUSTOM_POS_Y|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_Y=%s must be within [%s - %s]" % (params.CUSTOM_POS_Y, min.y, max.y))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_DZ %}
	{% if params.CUSTOM_POS_DZ|float >= min.z and params.CUSTOM_POS_DZ|float <= max.z %}
	{% set _dummy = tl.park.custom.update({'dz':params.CUSTOM_POS_DZ|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_DZ=%s must be within [%s - %s]" % (params.CUSTOM_POS_DZ, min.z, max.z))}
	{% endif %}
	{% endif %}
	{% if params.PARK_ENABLE %}
	{% if params.PARK_ENABLE|lower is in ['true', 'false'] %}
	{% set _dummy = tl.park.update({'enable':True if params.PARK_ENABLE|lower == 'true' else False}) %}
	{% else %}
	{action_raise_error("PARK_ENABLE=%s not supported. Allowed values are [True, False]" % params.PARK_ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.PARK_POS %}
	{% if params.PARK_POS|lower is in ['center','front_left','front_right','back_left','back_right','custom','x_only','y_only'] %}
	{% set dic = {'center'      : {'x': park.center.x   , 'y': park.center.y   , 'dz': 1                },
	'front_left'  : {'x': park.min.x      , 'y': park.min.y      , 'dz': 0                },
	'front_right' : {'x': park.max.x      , 'y': park.min.y      , 'dz': 0                },
	'back_left'   : {'x': park.min.x      , 'y': park.max.y      , 'dz': 0                },
	'back_right'  : {'x': park.max.x      , 'y': park.max.y      , 'dz': 0                },
	'custom'      : {'x': tl.park.custom.x, 'y': tl.park.custom.y, 'dz': tl.park.custom.dz},
	'x_only'      : {'x': tl.park.custom.x, 'y': 'none'          , 'dz': tl.park.custom.dz},
	'y_only'      : {'x': 'none'          , 'y': tl.park.custom.y, 'dz': tl.park.custom.dz}} %}
	{% set _dummy = tl.park.update({'pos':params.PARK_POS|lower}) %}
	{% set _dummy = tl.park.update({'coord':dic[tl.park.pos]}) %}
	{% else %}
	{action_raise_error("PARK_POS=%s not supported. Allowed values are [CENTER, FRONT_LEFT, FRONT_RIGHT, BACK_LEFT, BACK_RIGHT, CUSTOM, X_ONLY, Y_ONLY]"
	% params.PARK_POS|upper)}
	{% endif %}
	{% endif %}
	{% if params.PARK_TIME %}
	{% if params.PARK_TIME|float >= 0.0 %}
	{% set _dummy = tl.park.update({'time':params.PARK_TIME|float|round(3)}) %}
	{% else %}
	{action_raise_error("PARK_TIME=%s must be a positive number" % params.PARK_TIME)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=park VALUE="{tl.park}"
	{% if params.TRAVEL_SPEED %}
	{% if params.TRAVEL_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'travel':params.TRAVEL_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("TRAVEL_SPEED=%s must be larger than 0" % params.TRAVEL_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_SPEED %}
	{% if params.RETRACT_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'retract':params.RETRACT_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_SPEED=%s must be larger than 0" % params.RETRACT_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.EXTRUDE_SPEED %}
	{% if params.EXTRUDE_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'extrude':params.EXTRUDE_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_SPEED=%s must be larger than 0" % params.EXTRUDE_SPEED)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=speed VALUE="{tl.speed}"
	{% if params.EXTRUDE_DISTANCE %}
	{% if params.EXTRUDE_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'extrude':params.EXTRUDE_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_DISTANCE=%s must be specified as positiv number" % params.EXTRUDE_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_DISTANCE %}
	{% if params.RETRACT_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'retract':params.RETRACT_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_DISTANCE=%s must be specified as positiv number" % params.RETRACT_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.FW_RETRACT %}
	{% if params.FW_RETRACT|lower is in ['true', 'false'] %}
	{% if 'firmware_retraction' in printer.configfile.settings %}
	{% set _dummy = tl.extruder.update({'fw_retract': True if params.FW_RETRACT|lower == 'true' else False}) %}
	{% else %}
	{% set _dummy = tl.extruder.update({'fw_retract':False}) %}
	{% if params.FW_RETRACT|capitalize == 'True' %}
	{action_raise_error("[firmware_retraction] not defined in printer.cfg. Can not enable fw_retract")}
	{% endif %}
	{% endif %}
	{% else %}
	{action_raise_error("FW_RETRACT=%s not supported. Allowed values are [True, False]" % params.FW_RETRACT|capitalize)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=extruder VALUE="{tl.extruder}"
	{% if printer.configfile.settings['gcode_macro pause'] is defined %}
	{% set _dummy = tl.macro.update({'pause': printer.configfile.settings['gcode_macro pause'].rename_existing}) %}
	{% endif %}
	{% if printer.configfile.settings['gcode_macro resume'] is defined %}
	{% set _dummy = tl.macro.update({'resume': printer.configfile.settings['gcode_macro resume'].rename_existing}) %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=macro VALUE="{tl.macro}"

[gcode_macro TIMELAPSE_TAKE_FRAME]
description = Take Timelapse shoot
variable_enable = False
variable_takingframe = False
variable_park = {'enable': False,
	'pos'   : 'center',
	'time'  : 0.1,
	'custom': {'x': 0, 'y': 0, 'dz': 0},
	'coord' : {'x': 0, 'y': 0, 'dz': 0}}
variable_extruder = {'fw_retract': False,
	'retract': 1.0,
	'extrude': 1.0}
variable_speed = {'travel': 100,
	'retract': 15,
	'extrude': 15}
variable_verbose = True
variable_check_time = 0.5
variable_restore = {'absolute': {'coordinates': True, 'extrude': True}, 'speed': 1500, 'e':0, 'factor': {'speed': 1.0, 'extrude': 1.0}}
variable_macro = {'pause': 'PAUSE', 'resume': 'RESUME'}
variable_is_paused = False
gcode = 
	{% set hyperlapse = True if params.HYPERLAPSE and params.HYPERLAPSE|lower =='true' else False %}
	{% if enable %}
	{% if (hyperlapse and printer['gcode_macro HYPERLAPSE'].run) or
	(not hyperlapse and not printer['gcode_macro HYPERLAPSE'].run) %}
	{% if park.enable %}
	{% set pos = {'x': 'X' + park.coord.x|string if park.pos != 'y_only' else '',
	'y': 'Y' + park.coord.y|string if park.pos != 'x_only' else '',
	'z': 'Z'+ [printer.gcode_move.gcode_position.z + park.coord.dz, printer.toolhead.axis_maximum.z]|min|string} %}
	{% set restore = {'absolute': {'coordinates': printer.gcode_move.absolute_coordinates,
	'extrude'    : printer.gcode_move.absolute_extrude},
	'speed'   : printer.gcode_move.speed,
	'e'       : printer.gcode_move.gcode_position.e,
	'factor'  : {'speed'  : printer.gcode_move.speed_factor,
	'extrude': printer.gcode_move.extrude_factor}} %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=restore VALUE="{restore}"
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, minimum extruder temperature not reached!")}{% endif %}
	{% else %}
	{% if extruder.fw_retract %}
	G10
	{% else %}
	M83
	G0 E-{extruder.retract} F{speed.retract * 60}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=True
	{macro.pause}
	SET_GCODE_OFFSET X=0 Y=0
	G90
	{% if "xyz" not in printer.toolhead.homed_axes %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, axis not homed yet!")}{% endif %}
	{% else %}
	G0 {pos.x} {pos.y} {pos.z} F{speed.travel * 60}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=takingframe VALUE=True
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={check_time}
	M400
	{% endif %}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE={hyperlapse}
	{% endif %}
	{% else %}
	{% if verbose %}{action_respond_info("Timelapse: disabled, take frame ignored")}{% endif %}
	{% endif %}

[gcode_macro _TIMELAPSE_NEW_FRAME]
description = action call for timelapse shoot. must be a seperate macro
gcode = 
	{action_call_remote_method("timelapse_newframe",
	macropark=printer['gcode_macro TIMELAPSE_TAKE_FRAME'].park,
	hyperlapse=params.HYPERLAPSE)}

[delayed_gcode _WAIT_TIMELAPSE_TAKE_FRAME]
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set factor = {'speed': printer.gcode_move.speed_factor, 'extrude': printer.gcode_move.extrude_factor} %}
	{% if tl.takingframe %}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={tl.check_time}
	{% else %}
	{tl.macro.resume} VELOCITY={tl.speed.travel}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=False
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{action_respond_info("Timelapse: Warning minimum extruder temperature not reached!")}
	{% else %}
	{% if tl.extruder.fw_retract %}
	G11
	{% else %}
	G0 E{tl.extruder.extrude} F{tl.speed.extrude * 60}
	G0 F{tl.restore.speed}
	{% if tl.restore.absolute.extrude %}
	M82
	G92 E{tl.restore.e}
	{% endif %}
	{% endif %}
	{% endif %}
	{% if tl.restore.factor.speed   != factor.speed   %} M220 S{(factor.speed*100)|round(0)}   {% endif %}
	{% if tl.restore.factor.extrude != factor.extrude %} M221 S{(factor.extrude*100)|round(0)} {% endif %}
	{% if not tl.restore.absolute.coordinates %} G91 {% endif %}
	{% endif %}

[gcode_macro HYPERLAPSE]
description = Start/Stop a hyperlapse recording
variable_cycle = 0
variable_run = False
gcode = 
	{% set cycle = params.CYCLE|default(30)|int %}
	{% if params.ACTION and params.ACTION|lower == 'start' %}
	{action_respond_info("Hyperlapse: frames started (Cycle %d sec)" % cycle)}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=True
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=cycle VALUE={cycle}
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True
	{% elif params.ACTION and params.ACTION|lower == 'stop' %}
	{% if run %}{action_respond_info("Hyperlapse: frames stopped")}{% endif %}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=False
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION=0
	{% else %}
	{action_raise_error("Hyperlapse: No valid input parameter
	Use:
	- HYPERLAPSE ACTION=START [CYCLE=time]
	- HYPERLAPSE ACTION=STOP")}
	{% endif %}

[delayed_gcode _HYPERLAPSE_LOOP]
gcode = 
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={printer["gcode_macro HYPERLAPSE"].cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True

[gcode_macro TIMELAPSE_RENDER]
description = Render Timelapse video and wait for the result
variable_render = False
variable_run_identifier = 0
gcode = 
	{action_respond_info("Timelapse: Rendering started")}
	{action_call_remote_method("timelapse_render", byrendermacro="True")}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=render VALUE=True
	{printer.configfile.settings['gcode_macro pause'].rename_existing}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5

[delayed_gcode _WAIT_TIMELAPSE_RENDER]
gcode = 
	{% set ri = printer['gcode_macro TIMELAPSE_RENDER'].run_identifier % 4 %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=run_identifier VALUE={ri + 1}
	{% if printer['gcode_macro TIMELAPSE_RENDER'].render %}
	M117 Rendering {['-','\\\\','|','/'][ri]}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5
	{% else %}
	{action_respond_info("Timelapse: Rendering finished")}
	M117
	{printer.configfile.settings['gcode_macro resume'].rename_existing}
	{% endif %}

[gcode_macro TEST_STREAM_DELAY]
description = Helper macro to find stream and park delay
gcode = 
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set act = printer.toolhead.position %}
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% if act.z > 5.0 %}
	G0 X{min.x + 5.0} F{tl.speed.travel|int * 60}
	G0 X{(max.x-min.x)/2}
	G4 P{tl.park.time|float * 1000}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE=FALSE
	G0 X{max.x - 5.0}
	{% else %}
	{action_raise_error("Toolhead z %.3f to low. Please place head above z = 5.0" % act.z)}
	{% endif %}

[gcode_macro PIDcalibrate]
gcode = 
	PID_CALIBRATE HEATER=extruder TARGET=235
	PID_CALIBRATE HEATER=heater_bed TARGET=80

[gcode_macro POWER_OFF_PRINTER]
gcode = 
	{action_call_remote_method( "set_device_power", device="printer_plug", state="off")}

[gcode_macro START_PRINT]
gcode = 
	{% set BED_TEMP = params.BED_TEMP|default(60)|float %}
	
	{% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(190)|float %}
	
	M140 S{BED_TEMP}
	
	G90
	
	G28
	
	G1 Z5 F3000
	BED_MESH_PROFILE LOAD=default
	
	M190 S{BED_TEMP}
	
	M109 S{EXTRUDER_TEMP}
	M117 Purge extruder
	G1 X25 Y20 Z0.3 F5000.0
	G1 X25 Y175.0 Z0.3 F1500.0 E15
	G1 X25 Y175.0 Z0.4 F5000.0
	G1 X25 Y20 Z0.4 F1500.0 E30
	G92 E0
	G1 Z1.0 F3000

[gcode_macro END_PRINT]
gcode = 
	
	M140 S0
	M104 S0
	
	M106 S0
	
	G91
	G1 X-2 Y-2 E-3 F300
	
	G1 Z10 F3000
	G90
	
	M84
	BED_MESH_CLEAR

[gcode_macro CALCULATE_BED_MESH]
description = Calculate bed_mesh boundaries automatically based on your bltouch/probe config
gcode = 
	{% set BED_MESH_MARGIN = params.BED_MESH_MARGIN|default(10)|float %}
	
	{% set X_MAX = printer.toolhead.axis_maximum.x|default(230)|float %}
	{% set Y_MAX = printer.toolhead.axis_maximum.y|default(230)|float %}
	
	{% set X_OFFSET = 0.0 |float %}
	{% set Y_OFFSET = 0.0 |float %}
	
	{% if printer.configfile.config["bltouch"] is defined %}
	{% set X_OFFSET = (printer.configfile.settings.bltouch.x_offset if printer.configfile.settings.bltouch.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.settings.bltouch.y_offset if printer.configfile.settings.bltouch.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	{% if printer.configfile.config["probe"] is defined %}
	{% set X_OFFSET = (printer.configfile.config.probe.x_offset if printer.configfile.config.probe.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.config.probe.y_offset if printer.configfile.config.probe.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	
	
	
	{% set BED_MESH_MIN_X = BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MIN_Y = BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_X = X_MAX - (X_OFFSET)|abs - BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_MAX - BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_Y = Y_MAX - (Y_OFFSET)|abs - BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_MAX - BED_MESH_MARGIN |float %}
	
	
	{action_respond_info("BED_MESH_MARGIN : %f" % (BED_MESH_MARGIN))}
	{action_respond_info("X_MAX           : %f" % (X_MAX))}
	{action_respond_info("Y_MAX           : %f" % (Y_MAX))}
	{action_respond_info("X_OFFSET        : %f" % (X_OFFSET))}
	{action_respond_info("Y_OFFSET        : %f" % (Y_OFFSET))}
	{action_respond_info("BED_MESH_MIN_X  : %f" % (BED_MESH_MIN_X))}
	{action_respond_info("BED_MESH_MIN_Y  : %f" % (BED_MESH_MIN_Y))}
	{action_respond_info("BED_MESH_MAX_X  : %f" % (BED_MESH_MAX_X))}
	{action_respond_info("BED_MESH_MAX_Y  : %f" % (BED_MESH_MAX_Y))}
	{action_respond_info("--- VALUES TO ADD OR UPDATE TO OUR BED_MESH VALUES ---")}
	{action_respond_info("--- VALORES PARA AGREGAR O ACTUALIZAR EN NUESTRA SECCIÓN BED_MESH ---")}
	{action_respond_info("mesh_max: %s,%s" % (BED_MESH_MAX_X,BED_MESH_MAX_Y))}
	{action_respond_info("mesh_min: %s,%s" % (BED_MESH_MIN_X,BED_MESH_MIN_Y))}

[gcode_macro PID_EXTRUDER]
description = PID Tune for the Extruder
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set T = params.TEMPERATURE|default(210)|float %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set P = printer.configfile.config[e].pid_kp|float %}
	{% set I = printer.configfile.config[e].pid_ki|float %}
	{% set D = printer.configfile.config[e].pid_kd|float %}
	M118 Homing...
	G28
	M106 S{S}
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Extruder PID calibration...
	PID_CALIBRATE HEATER={e} TARGET={T}
	TURN_OFF_HEATERS
	M107
	SAVE_CONFIG

[gcode_macro PID_BED]
description = PID Tune for the Bed
gcode = 
	{% set T = params.TEMPERATURE|default(60)|float %}
	{% set P = printer.configfile.config['heater_bed'].pid_kp|float %}
	{% set I = printer.configfile.config['heater_bed'].pid_ki|float %}
	{% set D = printer.configfile.config['heater_bed'].pid_kd|float %}
	M118 Homing...
	G28
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={T}
	TURN_OFF_HEATERS
	SAVE_CONFIG

[gcode_macro PID_ALL]
description = Heater and Bed temperature calibration. Usage: PID_ALL [TE=temperature] [TB=temperature]\\n Calibra la temperatura del extrusor y la cama. Uso: PID_ALL [TE=temperatura] [TB=temperature]
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set TE = params.TE|default(195)|int %}
	{% set TB = params.TB|default(45)|int %}
	M118 Homing...
	G28
	M118 Extruder PID calibration...
	M106 S{S}
	PID_CALIBRATE HEATER={e} TARGET={TE}
	M107
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={TB}
	SAVE_CONFIG

[tmc2209 stepper_x]
uart_pin = PE6
run_current = 0.9
diag_pin = ^PA15
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_y]
uart_pin = PE3
run_current = 0.9
diag_pin = ^PD2
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_z]
uart_pin = PB7
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 stepper_z1]
uart_pin = PD4
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 extruder]
uart_pin = PB3
run_current = 0.842
diag_pin = 
stealthchop_threshold = 0

[mcu eddy]
serial = /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00
restart_method = command

[temperature_sensor btt_eddy_mcu]
sensor_type = temperature_mcu
sensor_mcu = eddy
min_temp = 10
max_temp = 100

[probe_eddy_current btt_eddy]
sensor_type = ldc1612
z_offset = 2.5
i2c_mcu = eddy
i2c_bus = i2c0f
x_offset = -30
y_offset = 5
reg_drive_current = 16
calibrate = 
	0.050188:3205933.097,0.090337:3205145.727,0.130487:3204354.163,
	0.169383:3203615.123,0.209533:3202860.267,0.249683:3202120.825,
	0.289833:3201389.932,0.329983:3200675.781,0.370133:3199937.342,
	0.410283:3199271.075,0.450433:3198562.823,0.490583:3197906.664,
	0.529478:3197264.891,0.569628:3196643.334,0.609778:3195982.110,
	0.649928:3195394.352,0.690078:3194737.336,0.730228:3194161.411,
	0.770378:3193564.178,0.810528:3192980.830,0.849423:3192409.769,
	0.889573:3191874.493,0.929723:3191327.866,0.969873:3190787.673,
	1.010023:3190232.313,1.050173:3189727.474,1.090323:3189210.067,
	1.130473:3188739.481,1.170623:3188237.257,1.209519:3187753.422,
	1.249669:3187291.436,1.289819:3186821.547,1.329969:3186360.473,
	1.370119:3185924.800,1.410269:3185491.381,1.450419:3185053.330,
	1.490569:3184594.190,1.529464:3184205.277,1.569614:3183785.498,
	1.609764:3183350.340,1.649914:3182966.762,1.690064:3182588.711,
	1.730214:3182190.755,1.770364:3181813.670,1.810514:3181420.036,
	1.849409:3181087.634,1.889559:3180703.858,1.929709:3180363.438,
	1.969859:3180003.082,2.010009:3179664.903,2.050159:3179332.781,
	2.090309:3178990.508,2.130459:3178673.256,2.170609:3178345.224,
	2.209505:3178050.416,2.249655:3177734.057,2.289805:3177419.463,
	2.329955:3177136.203,2.370105:3176837.527,2.410255:3176546.139,
	2.450405:3176268.706,2.490555:3175972.146,2.529450:3175723.811,
	2.569600:3175470.080,2.609750:3175223.081,2.649900:3174962.842,
	2.690050:3174704.198,2.730200:3174460.913,2.770350:3174228.920,
	2.810500:3173989.118,2.849395:3173761.350,2.889545:3173516.616,
	2.929695:3173309.604,2.969845:3173089.770,3.009995:3172877.982,
	3.050145:3172644.639,3.090295:3172452.377,3.130445:3172252.422,
	3.170595:3172031.650,3.209491:3171857.260,3.249641:3171650.997,
	3.289791:3171441.897,3.329941:3171248.522,3.370091:3171071.032,
	3.410241:3170902.167,3.450391:3170700.892,3.490541:3170509.888,
	3.529436:3170367.070,3.569586:3170188.460,3.609736:3170015.379,
	3.649886:3169825.355,3.690036:3169687.899,3.730186:3169514.422,
	3.770336:3169378.249,3.810486:3169199.096,3.849381:3169055.600,
	3.889531:3168906.908,3.929681:3168770.855,3.969831:3168587.431,
	4.009981:3168461.835,4.050131:3168313.942

[temperature_probe btt_eddy]
sensor_type = Generic 3950
sensor_pin = eddy:gpio26
horizontal_move_z = 2
calibration_temp = 29.941653
drift_calibration = 
	3322659.134314, -5564.540372, 60.398093
	3204466.582019, -381.239579, 3.440192
	3191594.449302, -119.470102, 1.125202
	3183159.664481, 17.721542, -0.153070
	3176791.037916, 107.407930, -0.957123
	3171474.720102, 190.159212, -1.751515
	3166582.715676, 281.955770, -2.675074
	3163316.106670, 318.670366, -2.988620
	3160957.710763, 338.412885, -3.164299
drift_calibration_min_temp = 33.83103284492943

[bed_mesh]
speed = 50
horizontal_move_z = 1
mesh_min = 50,60
mesh_max = 280, 310
probe_count = 9, 9
mesh_pps = 3, 3
algorithm = bicubic
bicubic_tension = 0.2

[safe_z_home]
home_xy_position = 204, 185
speed = 50
z_hop = 10
z_hop_speed = 10

[save_variables]
filename = ~/printer_data/config/variables.cfg

[force_move]
enable_force_move = True

[delayed_gcode RESTORE_PROBE_OFFSET]
initial_duration = 1.
gcode = 
	{% set svv = printer.save_variables.variables %}
	{% if not printer["gcode_macro SET_GCODE_OFFSET"].restored %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ svv.nvm_offset|default(0) }
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=restored VALUE=True
	{% endif %}

[gcode_macro G28]
rename_existing = G28.1
gcode = 
	
	G28.1 {rawparams}
	{% if not rawparams or (rawparams and 'Z' in rawparams) %}
	PROBE
	SET_Z_FROM_PROBE
	{% endif %}

[gcode_macro SET_Z_FROM_PROBE]
gcode = 
	{% set cf = printer.configfile.settings %}
	SET_GCODE_OFFSET_ORIG Z={printer.probe.last_z_result - cf['probe_eddy_current btt_eddy'].z_offset + printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset}
	G90
	G1 Z{cf.safe_z_home.z_hop}

[gcode_macro Z_OFFSET_APPLY_PROBE]
rename_existing = Z_OFFSET_APPLY_PROBE_ORIG
gcode = 
	SAVE_VARIABLE VARIABLE=nvm_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset }

[gcode_macro SET_GCODE_OFFSET]
rename_existing = SET_GCODE_OFFSET_ORIG
variable_restored = False
variable_runtime_offset = 0
gcode = 
	{% if params.Z_ADJUST %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset + params.Z_ADJUST|float }
	{% endif %}
	{% if params.Z %}
	{% set paramList = rawparams.split() %}
	{% for i in range(paramList|length) %}
	{% if paramList[i]=="Z=0" %}
	{% set temp=paramList.pop(i) %}
	{% set temp="Z_ADJUST=" + (-printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset)|string %}
	{% if paramList.append(temp) %}{% endif %}
	{% endif %}
	{% endfor %}
	{% set rawparams=paramList|join(' ') %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE=0
	{% endif %}
	SET_GCODE_OFFSET_ORIG { rawparams }

[gcode_macro PROBE_EDDY_CURRENT_CALIBRATE_AUTO]
gcode = 
	BED_MESH_CLEAR
	G28 X Y
	G90
	G1 X{ printer.toolhead.axis_maximum.x/2 } Y{ printer.toolhead.axis_maximum.y/2 } F6000
	{% if 'z' not in printer.toolhead.homed_axes %}
	SET_KINEMATIC_POSITION Z={ printer.toolhead.axis_maximum.z-1 }
	{% endif %}
	PROBE_EDDY_CURRENT_CALIBRATE {rawparams}

[mcu]
serial = /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00

[stepper_x]
step_pin = PC14
dir_pin = !PC13
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA14
position_endstop = 0
position_min = 0
position_max = 330
homing_speed = 50

[stepper_y]
step_pin = PE5
dir_pin = PE4
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA15
position_endstop = 0
position_min = 0
position_max = 320
homing_speed = 50

[stepper_z1]
step_pin = PE1
dir_pin = PE0
enable_pin = !PE2
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop

[stepper_z]
step_pin = PD6
dir_pin = PD5
enable_pin = !PD7
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop
position_max = 400
position_min = -5
homing_speed = 10

[screws_tilt_adjust]
screw1 = 204,185
screw1_name = Central screw
screw2 = 105,84
screw2_name = Front left screw
screw3 = 305,84
screw3_name = Rear left screw
screw4 = 305,284
screw4_name = Front right screw
screw5 = 105, 284
screw5_name = Rear right screw
horizontal_move_z = 10
speed = 100
screw_thread = CW-M3

[bed_screws]
screw1 = 50,70
screw2 = 250,70
screw3 = 250, 230
screw4 = 50, 230

[z_tilt]
z_positions = -60, 155
	330, 155
points = 70, 184
	300, 184
speed = 100
horizontal_move_z = 10
retries = 8
retry_tolerance = 0.005

[extruder]
step_pin = PB5
dir_pin = !PB4
enable_pin = !PB6
microsteps = 16
rotation_distance = 8.06
nozzle_diameter = 0.400
filament_diameter = 1.750
heater_pin = PB1
sensor_type = ATC Semitec 104GT-2
sensor_pin = PC1
max_extrude_only_distance = 100000
min_temp = 0
max_temp = 260
pressure_advance = 0.08
control = pid
pid_kp = 39.588
pid_ki = 7.762
pid_kd = 50.475

[heater_bed]
heater_pin = PB10
sensor_type = ATC Semitec 104NT-4-R025H42G
sensor_pin = PC0
min_temp = 0
max_temp = 130
control = pid
pid_kp = 57.129
pid_ki = 2.026
pid_kd = 402.756
x_count = 4
y_count = 4
mesh_x_pps = 2
mesh_y_pps = 2
algo = bicubic
tension = 0.2
min_x = 40.0
max_x = 256.0
min_y = 60.0
max_y = 279.98999999999995

[fan]
pin = PA2
max_power = 1.0
off_below = 0.1

[heater_fan hotend]
pin = PA0
heater = extruder
heater_temp = 50.0
fan_speed = 1.0
shutdown_speed = 1.0

[printer]
kinematics = cartesian
max_velocity = 250
max_accel = 4500
max_z_velocity = 25
max_z_accel = 100

[skew_correction]

[bed_mesh default]
version = 1
points = 
	0.077380, 0.111423, 0.114676, 0.156457, 0.174093, 0.168682, 0.150091, 0.125241, 0.144394
	0.019770, 0.035236, 0.040041, 0.064163, 0.097841, 0.072235, 0.036121, 0.038328, -0.022320
	-0.046588, -0.004041, -0.002183, 0.034924, 0.056260, 0.057109, 0.025641, -0.003699, 0.000421
	-0.014058, -0.015146, -0.014967, 0.007296, 0.033845, 0.025323, -0.004179, -0.028621, -0.045631
	-0.053217, -0.062006, -0.048567, -0.019670, -0.003835, 0.000873, -0.021848, -0.046722, -0.038119
	-0.082454, -0.064824, -0.071665, -0.049962, -0.027577, -0.036043, -0.056768, -0.072205, -0.063067
	0.026282, -0.006652, -0.015925, 0.013883, 0.040249, 0.050473, 0.018200, -0.017486, -0.044483
	0.006865, 0.029730, 0.028595, 0.044249, 0.088176, 0.080421, 0.046590, 0.046284, 0.075516
	0.059874, -0.031578, -0.021740, 0.006004, 0.063576, 0.092164, 0.028281, -0.012436, -0.035619
x_count = 9
y_count = 9
mesh_x_pps = 3
mesh_y_pps = 3
algo = bicubic
tension = 0.2
min_x = 50.0
max_x = 280.0
min_y = 60.0
max_y = 310.0

[skew_correction mi_skew]
xy_skew = -0.00679190845337054
xz_skew = 0.0
yz_skew = 0.0
=======================
temperature_probe btt_eddy: loaded temperature drift calibration. Min Temp: 33.83, Min Freq: 3156001.351363
y(x) = 60.398093x^2 - 5564.540372x + 3322659.134314
y(x) = 3.440192x^2 - 381.239579x + 3204466.582019
y(x) = 1.125202x^2 - 119.470102x + 3191594.449302
y(x) = -0.153070x^2 + 17.721542x + 3183159.664481
y(x) = -0.957123x^2 + 107.407930x + 3176791.037916
y(x) = -1.751515x^2 + 190.159212x + 3171474.720102
y(x) = -2.675074x^2 + 281.955770x + 3166582.715676
y(x) = -2.988620x^2 + 318.670366x + 3163316.106670
y(x) = -3.164299x^2 + 338.412885x + 3160957.710763
temperature_probe btt_eddy: registered drift compensation with probe [probe_eddy_current btt_eddy]
Extruder max_extrude_ratio=0.266081
mcu 'mcu': Starting serial connect
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
webhooks client 548219268176: New connection
webhooks client 548219268176: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
MCU error during connect
Traceback (most recent call last):
  File "/home/luis/klipper/klippy/mcu.py", line 772, in _attach
    self._serial.connect_uart(self._serialport, self._baud, rts)
  File "/home/luis/klipper/klippy/serialhdl.py", line 191, in connect_uart
    self._error("Unable to connect")
  File "/home/luis/klipper/klippy/serialhdl.py", line 68, in _error
    raise error(self.warn_prefix + (msg % params))
serialhdl.error: mcu 'mcu': Unable to connect

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/luis/klipper/klippy/klippy.py", line 131, in _connect
    self.send_event("klippy:mcu_identify")
  File "/home/luis/klipper/klippy/klippy.py", line 223, in send_event
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klipper/klippy/klippy.py", line 223, in <listcomp>
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
            ^^^^^^^^^^^
  File "/home/luis/klipper/klippy/mcu.py", line 782, in _mcu_identify
    self._attach()
  File "/home/luis/klipper/klippy/mcu.py", line 777, in _attach
    raise error(str(e))
mcu.error: mcu 'mcu': Unable to connect
mcu 'mcu': Unable to connect
Once the underlying issue is corrected, use the
"FIRMWARE_RESTART" command to reset the firmware, reload the
config, and restart the host software.
Error configuring printer

Build file /home/luis/klipper/klippy/../.config(1858): Thu Jan  8 03:15:30 2026
========= Last MCU build config =========
# CONFIG_LOW_LEVEL_OPTIONS is not set
CONFIG_MACH_AVR=y
# CONFIG_MACH_ATSAM is not set
# CONFIG_MACH_ATSAMD is not set
# CONFIG_MACH_LPC176X is not set
# CONFIG_MACH_STM32 is not set
# CONFIG_MACH_HC32F460 is not set
# CONFIG_MACH_RPXXXX is not set
# CONFIG_MACH_PRU is not set
# CONFIG_MACH_AR100 is not set
# CONFIG_MACH_LINUX is not set
# CONFIG_MACH_SIMU is not set
CONFIG_AVR_SELECT=y
CONFIG_BOARD_DIRECTORY="avr"
CONFIG_MACH_atmega2560=y
# CONFIG_MACH_atmega1280 is not set
# CONFIG_MACH_at90usb1286 is not set
# CONFIG_MACH_at90usb646 is not set
# CONFIG_MACH_atmega32u4 is not set
# CONFIG_MACH_atmega1284p is not set
# CONFIG_MACH_atmega644p is not set
# CONFIG_MACH_atmega328p is not set
# CONFIG_MACH_atmega328 is not set
# CONFIG_MACH_atmega168 is not set
CONFIG_MCU="atmega2560"
CONFIG_AVRDUDE_PROTOCOL="wiring"
CONFIG_CLOCK_FREQ=16000000
CONFIG_AVR_CLKPR=-1
CONFIG_AVR_STACK_SIZE=256
CONFIG_AVR_WATCHDOG=y
CONFIG_SERIAL=y
CONFIG_SERIAL_BAUD_U2X=y
CONFIG_SERIAL_PORT=0
CONFIG_SERIAL_BAUD=250000
CONFIG_USB_VENDOR_ID=0x1d50
CONFIG_USB_DEVICE_ID=0x614e
CONFIG_USB_SERIAL_NUMBER="12345"
CONFIG_WANT_ADC=y
CONFIG_WANT_SPI=y
CONFIG_WANT_SOFTWARE_SPI=y
CONFIG_WANT_I2C=y
CONFIG_WANT_SOFTWARE_I2C=y
CONFIG_WANT_HARD_PWM=y
CONFIG_WANT_BUTTONS=y
CONFIG_WANT_TMCUART=y
CONFIG_WANT_NEOPIXEL=y
CONFIG_WANT_PULSE_COUNTER=y
CONFIG_WANT_ST7920=y
CONFIG_WANT_HD44780=y
CONFIG_WANT_ADXL345=y
CONFIG_WANT_LIS2DW=y
CONFIG_WANT_MPU9250=y
CONFIG_WANT_ICM20948=y
CONFIG_WANT_THERMOCOUPLE=y
CONFIG_WANT_HX71X=y
CONFIG_WANT_ADS1220=y
CONFIG_WANT_LDC1612=y
CONFIG_WANT_SENSOR_ANGLE=y
CONFIG_NEED_SENSOR_BULK=y
CONFIG_WANT_LOAD_CELL_PROBE=y
CONFIG_NEED_SOS_FILTER=y
CONFIG_CANBUS_FREQUENCY=1000000
CONFIG_INLINE_STEPPER_HACK=y
CONFIG_HAVE_GPIO=y
CONFIG_HAVE_GPIO_ADC=y
CONFIG_HAVE_GPIO_SPI=y
CONFIG_HAVE_GPIO_I2C=y
CONFIG_HAVE_GPIO_HARD_PWM=y
CONFIG_HAVE_STRICT_TIMING=y
=======================
No build file /home/luis/klipper/klippy/../out/klipper.dict
No build file /home/luis/klipper/klippy/../out/klipper.elf
Attempting MCU 'mcu' reset
Unhandled exception during post run
Traceback (most recent call last):
  File "/home/luis/klippy-env/lib/python3.11/site-packages/serial/serialposix.py", line 265, in open
    self.fd = os.open(self.portstr, os.O_RDWR | os.O_NOCTTY | os.O_NONBLOCK)
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/luis/klipper/klippy/klippy.py", line 193, in run
    self.send_event("klippy:firmware_restart")
  File "/home/luis/klipper/klippy/klippy.py", line 223, in send_event
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klipper/klippy/klippy.py", line 223, in <listcomp>
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
            ^^^^^^^^^^^
  File "/home/luis/klipper/klippy/mcu.py", line 669, in _firmware_restart
    self._restart_arduino()
  File "/home/luis/klipper/klippy/mcu.py", line 629, in _restart_arduino
    serialhdl.arduino_reset(serialport, self._reactor)
  File "/home/luis/klipper/klippy/serialhdl.py", line 392, in arduino_reset
    ser = serial.Serial(serialport, 2400, timeout=0, exclusive=True)
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klippy-env/lib/python3.11/site-packages/serial/serialutil.py", line 240, in __init__
    self.open()
  File "/home/luis/klippy-env/lib/python3.11/site-packages/serial/serialposix.py", line 268, in open
    raise SerialException(msg.errno, "could not open port {}: {}".format(self._port, msg))
serial.serialutil.SerialException: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
Restarting printer
Start printer at Thu Jan  8 03:29:50 2026 (1767842990.2 1153.8)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if last_extruder_temp.restore %}
	
	RESPOND TYPE=echo MSG='{"Restoring \\"%s\\" temperature to %3.1f\\u00B0C, this may take some time" % (printer.toolhead.extruder, last_extruder_temp.temp) }'
	M109 S{last_extruder_temp.temp}
	{% set do_resume = True %}
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	{% if runout_resume %}
	{% if do_resume %}
	{% if restore_idle_timeout > 0 %} SET_IDLE_TIMEOUT TIMEOUT={restore_idle_timeout} {% endif %}
	{client.user_resume_macro|default("")}
	_CLIENT_EXTRUDE
	RESUME_BASE VELOCITY={params.VELOCITY|default(sp_move)}
	{% endif %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]}'
	{% set _d = prompt_txt.append("\\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]) %}
	{% endif %}
	
	{% if not (runout_resume and do_resume) %}
	RESPOND TYPE=command MSG="action:prompt_begin RESUME aborted !!!"
	{% for element in prompt_txt %}
	RESPOND TYPE=command MSG='{"action:prompt_text %s" % element}'
	{% endfor %}
	RESPOND TYPE=command MSG="action:prompt_footer_button Ok|RESPOND TYPE=command MSG=action:prompt_end|info"
	RESPOND TYPE=command MSG="action:prompt_show"
	{% endif %}

[gcode_macro SET_PAUSE_NEXT_LAYER]
description = Enable a pause if the next layer is reached
gcode = 
	{% set pause_next_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_next_layer %}
	{% set ENABLE = params.ENABLE|default(1)|int != 0 %}
	{% set MACRO = params.MACRO|default(pause_next_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_next_layer VALUE="{{ 'enable': ENABLE, 'call': MACRO }}"

[gcode_macro SET_PAUSE_AT_LAYER]
description = Enable/disable a pause if a given layer number is reached
gcode = 
	{% set pause_at_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_at_layer %}
	{% set ENABLE = params.ENABLE|int != 0 if params.ENABLE is defined
	else params.LAYER is defined %}
	{% set LAYER = params.LAYER|default(pause_at_layer.layer)|int %}
	{% set MACRO = params.MACRO|default(pause_at_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_at_layer VALUE="{{ 'enable': ENABLE, 'layer': LAYER, 'call': MACRO }}"

[gcode_macro SET_PRINT_STATS_INFO]
rename_existing = SET_PRINT_STATS_INFO_BASE
description = Overwrite, to get pause_next_layer and pause_at_layer feature
variable_pause_next_layer = { 'enable': False, 'call': "PAUSE" }
variable_pause_at_layer = { 'enable': False, 'layer': 0, 'call': "PAUSE" }
gcode = 
	{% if pause_next_layer.enable %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_next_layer" % pause_next_layer.call}'
	{pause_next_layer.call}
	SET_PAUSE_NEXT_LAYER ENABLE=0
	{% elif pause_at_layer.enable and params.CURRENT_LAYER is defined and params.CURRENT_LAYER|int == pause_at_layer.layer %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_at_layer [%d]" % (pause_at_layer.call, pause_at_layer.layer)}'
	{pause_at_layer.call}
	SET_PAUSE_AT_LAYER ENABLE=0
	{% endif %}
	SET_PRINT_STATS_INFO_BASE {rawparams}

[gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL]
description = Helper: park toolhead used in PAUSE and CANCEL_PRINT
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set use_custom     = client.use_custom_pos|default(false)|lower == 'true' %}
	{% set custom_park_x  = client.custom_park_x|default(0.0) %}
	{% set custom_park_y  = client.custom_park_y|default(0.0) %}
	{% set park_dz        = client.custom_park_dz|default(2.0)|abs %}
	{% set sp_hop         = client.speed_hop|default(15) * 60 %}
	{% set sp_move        = client.speed_move|default(velocity) * 60 %}
	
	{% set origin    = printer.gcode_move.homing_origin %}
	{% set act       = printer.gcode_move.gcode_position %}
	{% set max       = printer.toolhead.axis_maximum %}
	{% set cone      = printer.toolhead.cone_start_z|default(max.z) %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	
	{% set z_min = params.Z_MIN|default(0)|float %}
	{% set z_park = [[(act.z + park_dz), z_min]|max, (max.z - origin.z)]|min %}
	{% set x_park = params.X       if params.X is defined
	else custom_park_x  if use_custom
	else 0.0            if round_bed
	else (max.x - 5.0) %}
	{% set y_park = params.Y       if params.Y is defined
	else custom_park_y  if use_custom
	else (max.y - 5.0)  if round_bed and z_park < cone
	else 0.0            if round_bed
	else (max.y - 5.0) %}
	
	_CLIENT_RETRACT
	{% if "xyz" in printer.toolhead.homed_axes %}
	G90
	G1 Z{z_park} F{sp_hop}
	G1 X{x_park} Y{y_park} F{sp_move}
	{% if not printer.gcode_move.absolute_coordinates %} G91 {% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='Printer not homed'
	{% endif %}

[gcode_macro _CLIENT_EXTRUDE]
description = Extrudes, if the extruder is hot enough
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set use_fw_retract = (client.use_fw_retract|default(false)|lower == 'true') and (printer.firmware_retraction is defined) %}
	{% set length = params.LENGTH|default(client.unretract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_unretract)|default(35) %}
	{% set absolute_extrude = printer.gcode_move.absolute_extrude %}
	
	{% if printer.toolhead.extruder != '' %}
	{% if printer[printer.toolhead.extruder].can_extrude %}
	{% if use_fw_retract %}
	{% if length < 0 %}
	G10
	{% else %}
	G11
	{% endif %}
	{% else %}
	M83
	G1 E{length} F{(speed|float|abs) * 60}
	{% if absolute_extrude %}
	M82
	{% endif %}
	{% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='{"\\"%s\\" not hot enough" % printer.toolhead.extruder}'
	{% endif %}
	{% endif %}

[gcode_macro _CLIENT_RETRACT]
description = Retracts, if the extruder is hot enough
gcode = 
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set length = params.LENGTH|default(client.retract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_retract)|default(35) %}
	
	_CLIENT_EXTRUDE LENGTH=-{length|float|abs} SPEED={speed|float|abs}

[gcode_macro _CLIENT_LINEAR_MOVE]
description = Linear move with save and restore of the gcode state
gcode = 
	{% set x_move = "X" ~ params.X if params.X is defined else "" %}
	{% set y_move = "Y" ~ params.Y if params.Y is defined else "" %}
	{% set z_move = "Z" ~ params.Z if params.Z is defined else "" %}
	{% set e_move = "E" ~ params.E if params.E is defined else "" %}
	{% set rate = "F" ~ params.F if params.F is defined else "" %}
	{% set ABSOLUTE = params.ABSOLUTE | default(0) | int != 0 %}
	{% set ABSOLUTE_E = params.ABSOLUTE_E | default(0) | int != 0 %}
	SAVE_GCODE_STATE NAME=_client_movement
	{% if x_move or y_move or z_move %}
	G9{ 0 if ABSOLUTE else 1 }
	{% endif %}
	{% if e_move %}
	M8{ 2 if ABSOLUTE_E else 3 }
	{% endif %}
	G1 { x_move } { y_move } { z_move } { e_move } { rate }
	RESTORE_GCODE_STATE NAME=_client_movement

[gcode_macro GET_TIMELAPSE_SETUP]
description = Print the Timelapse setup
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set output_txt = ["Timelapse Setup:"] %}
	{% set _dummy = output_txt.append("enable: %s" % tl.enable) %}
	{% set _dummy = output_txt.append("park: %s" % tl.park.enable) %}
	{% if tl.park.enable %}
	{% set _dummy = output_txt.append("park position: %s time: %s s" % (tl.park.pos, tl.park.time)) %}
	{% set _dummy = output_txt.append("park cord x:%s y:%s dz:%s" % (tl.park.coord.x, tl.park.coord.y, tl.park.coord.dz)) %}
	{% set _dummy = output_txt.append("travel speed: %s mm/s" % tl.speed.travel) %}
	{% endif %}
	{% set _dummy = output_txt.append("fw_retract: %s" % tl.extruder.fw_retract) %}
	{% if not tl.extruder.fw_retract %}
	{% set _dummy = output_txt.append("retract: %s mm speed: %s mm/s" % (tl.extruder.retract, tl.speed.retract)) %}
	{% set _dummy = output_txt.append("extrude: %s mm speed: %s mm/s" % (tl.extruder.extrude, tl.speed.extrude)) %}
	{% endif %}
	{% set _dummy = output_txt.append("verbose: %s" % tl.verbose) %}
	{action_respond_info(output_txt|join("\\n"))}

[gcode_macro _SET_TIMELAPSE_SETUP]
description = Set user parameters for timelapse
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	{% set park = {'min'   : {'x': (min.x / 1.42)|round(3) if round_bed else min.x|round(3),
	'y': (min.y / 1.42)|round(3) if round_bed else min.y|round(3)},
	'max'   : {'x': (max.x / 1.42)|round(3) if round_bed else max.x|round(3),
	'y': (max.y / 1.42)|round(3) if round_bed else max.y|round(3)},
	'center': {'x': (max.x-(max.x-min.x)/2)|round(3),
	'y': (max.y-(max.y-min.y)/2)|round(3)}} %}
	
	{% if params.ENABLE %}
	{% if params.ENABLE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=enable VALUE={True if params.ENABLE|lower == 'true' else False}
	{% else %}
	{action_raise_error("ENABLE=%s not supported. Allowed values are [True, False]" % params.ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.VERBOSE %}
	{% if params.VERBOSE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=verbose VALUE={True if params.VERBOSE|lower == 'true' else False}
	{% else %}
	{action_raise_error("VERBOSE=%s not supported. Allowed values are [True, False]" % params.VERBOSE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_X %}
	{% if params.CUSTOM_POS_X|float >= min.x and params.CUSTOM_POS_X|float <= max.x %}
	{% set _dummy = tl.park.custom.update({'x':params.CUSTOM_POS_X|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_X=%s must be within [%s - %s]" % (params.CUSTOM_POS_X, min.x, max.x))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_Y %}
	{% if params.CUSTOM_POS_Y|float >= min.y and params.CUSTOM_POS_Y|float <= max.y %}
	{% set _dummy = tl.park.custom.update({'y':params.CUSTOM_POS_Y|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_Y=%s must be within [%s - %s]" % (params.CUSTOM_POS_Y, min.y, max.y))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_DZ %}
	{% if params.CUSTOM_POS_DZ|float >= min.z and params.CUSTOM_POS_DZ|float <= max.z %}
	{% set _dummy = tl.park.custom.update({'dz':params.CUSTOM_POS_DZ|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_DZ=%s must be within [%s - %s]" % (params.CUSTOM_POS_DZ, min.z, max.z))}
	{% endif %}
	{% endif %}
	{% if params.PARK_ENABLE %}
	{% if params.PARK_ENABLE|lower is in ['true', 'false'] %}
	{% set _dummy = tl.park.update({'enable':True if params.PARK_ENABLE|lower == 'true' else False}) %}
	{% else %}
	{action_raise_error("PARK_ENABLE=%s not supported. Allowed values are [True, False]" % params.PARK_ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.PARK_POS %}
	{% if params.PARK_POS|lower is in ['center','front_left','front_right','back_left','back_right','custom','x_only','y_only'] %}
	{% set dic = {'center'      : {'x': park.center.x   , 'y': park.center.y   , 'dz': 1                },
	'front_left'  : {'x': park.min.x      , 'y': park.min.y      , 'dz': 0                },
	'front_right' : {'x': park.max.x      , 'y': park.min.y      , 'dz': 0                },
	'back_left'   : {'x': park.min.x      , 'y': park.max.y      , 'dz': 0                },
	'back_right'  : {'x': park.max.x      , 'y': park.max.y      , 'dz': 0                },
	'custom'      : {'x': tl.park.custom.x, 'y': tl.park.custom.y, 'dz': tl.park.custom.dz},
	'x_only'      : {'x': tl.park.custom.x, 'y': 'none'          , 'dz': tl.park.custom.dz},
	'y_only'      : {'x': 'none'          , 'y': tl.park.custom.y, 'dz': tl.park.custom.dz}} %}
	{% set _dummy = tl.park.update({'pos':params.PARK_POS|lower}) %}
	{% set _dummy = tl.park.update({'coord':dic[tl.park.pos]}) %}
	{% else %}
	{action_raise_error("PARK_POS=%s not supported. Allowed values are [CENTER, FRONT_LEFT, FRONT_RIGHT, BACK_LEFT, BACK_RIGHT, CUSTOM, X_ONLY, Y_ONLY]"
	% params.PARK_POS|upper)}
	{% endif %}
	{% endif %}
	{% if params.PARK_TIME %}
	{% if params.PARK_TIME|float >= 0.0 %}
	{% set _dummy = tl.park.update({'time':params.PARK_TIME|float|round(3)}) %}
	{% else %}
	{action_raise_error("PARK_TIME=%s must be a positive number" % params.PARK_TIME)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=park VALUE="{tl.park}"
	{% if params.TRAVEL_SPEED %}
	{% if params.TRAVEL_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'travel':params.TRAVEL_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("TRAVEL_SPEED=%s must be larger than 0" % params.TRAVEL_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_SPEED %}
	{% if params.RETRACT_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'retract':params.RETRACT_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_SPEED=%s must be larger than 0" % params.RETRACT_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.EXTRUDE_SPEED %}
	{% if params.EXTRUDE_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'extrude':params.EXTRUDE_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_SPEED=%s must be larger than 0" % params.EXTRUDE_SPEED)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=speed VALUE="{tl.speed}"
	{% if params.EXTRUDE_DISTANCE %}
	{% if params.EXTRUDE_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'extrude':params.EXTRUDE_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_DISTANCE=%s must be specified as positiv number" % params.EXTRUDE_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_DISTANCE %}
	{% if params.RETRACT_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'retract':params.RETRACT_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_DISTANCE=%s must be specified as positiv number" % params.RETRACT_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.FW_RETRACT %}
	{% if params.FW_RETRACT|lower is in ['true', 'false'] %}
	{% if 'firmware_retraction' in printer.configfile.settings %}
	{% set _dummy = tl.extruder.update({'fw_retract': True if params.FW_RETRACT|lower == 'true' else False}) %}
	{% else %}
	{% set _dummy = tl.extruder.update({'fw_retract':False}) %}
	{% if params.FW_RETRACT|capitalize == 'True' %}
	{action_raise_error("[firmware_retraction] not defined in printer.cfg. Can not enable fw_retract")}
	{% endif %}
	{% endif %}
	{% else %}
	{action_raise_error("FW_RETRACT=%s not supported. Allowed values are [True, False]" % params.FW_RETRACT|capitalize)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=extruder VALUE="{tl.extruder}"
	{% if printer.configfile.settings['gcode_macro pause'] is defined %}
	{% set _dummy = tl.macro.update({'pause': printer.configfile.settings['gcode_macro pause'].rename_existing}) %}
	{% endif %}
	{% if printer.configfile.settings['gcode_macro resume'] is defined %}
	{% set _dummy = tl.macro.update({'resume': printer.configfile.settings['gcode_macro resume'].rename_existing}) %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=macro VALUE="{tl.macro}"

[gcode_macro TIMELAPSE_TAKE_FRAME]
description = Take Timelapse shoot
variable_enable = False
variable_takingframe = False
variable_park = {'enable': False,
	'pos'   : 'center',
	'time'  : 0.1,
	'custom': {'x': 0, 'y': 0, 'dz': 0},
	'coord' : {'x': 0, 'y': 0, 'dz': 0}}
variable_extruder = {'fw_retract': False,
	'retract': 1.0,
	'extrude': 1.0}
variable_speed = {'travel': 100,
	'retract': 15,
	'extrude': 15}
variable_verbose = True
variable_check_time = 0.5
variable_restore = {'absolute': {'coordinates': True, 'extrude': True}, 'speed': 1500, 'e':0, 'factor': {'speed': 1.0, 'extrude': 1.0}}
variable_macro = {'pause': 'PAUSE', 'resume': 'RESUME'}
variable_is_paused = False
gcode = 
	{% set hyperlapse = True if params.HYPERLAPSE and params.HYPERLAPSE|lower =='true' else False %}
	{% if enable %}
	{% if (hyperlapse and printer['gcode_macro HYPERLAPSE'].run) or
	(not hyperlapse and not printer['gcode_macro HYPERLAPSE'].run) %}
	{% if park.enable %}
	{% set pos = {'x': 'X' + park.coord.x|string if park.pos != 'y_only' else '',
	'y': 'Y' + park.coord.y|string if park.pos != 'x_only' else '',
	'z': 'Z'+ [printer.gcode_move.gcode_position.z + park.coord.dz, printer.toolhead.axis_maximum.z]|min|string} %}
	{% set restore = {'absolute': {'coordinates': printer.gcode_move.absolute_coordinates,
	'extrude'    : printer.gcode_move.absolute_extrude},
	'speed'   : printer.gcode_move.speed,
	'e'       : printer.gcode_move.gcode_position.e,
	'factor'  : {'speed'  : printer.gcode_move.speed_factor,
	'extrude': printer.gcode_move.extrude_factor}} %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=restore VALUE="{restore}"
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, minimum extruder temperature not reached!")}{% endif %}
	{% else %}
	{% if extruder.fw_retract %}
	G10
	{% else %}
	M83
	G0 E-{extruder.retract} F{speed.retract * 60}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=True
	{macro.pause}
	SET_GCODE_OFFSET X=0 Y=0
	G90
	{% if "xyz" not in printer.toolhead.homed_axes %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, axis not homed yet!")}{% endif %}
	{% else %}
	G0 {pos.x} {pos.y} {pos.z} F{speed.travel * 60}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=takingframe VALUE=True
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={check_time}
	M400
	{% endif %}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE={hyperlapse}
	{% endif %}
	{% else %}
	{% if verbose %}{action_respond_info("Timelapse: disabled, take frame ignored")}{% endif %}
	{% endif %}

[gcode_macro _TIMELAPSE_NEW_FRAME]
description = action call for timelapse shoot. must be a seperate macro
gcode = 
	{action_call_remote_method("timelapse_newframe",
	macropark=printer['gcode_macro TIMELAPSE_TAKE_FRAME'].park,
	hyperlapse=params.HYPERLAPSE)}

[delayed_gcode _WAIT_TIMELAPSE_TAKE_FRAME]
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set factor = {'speed': printer.gcode_move.speed_factor, 'extrude': printer.gcode_move.extrude_factor} %}
	{% if tl.takingframe %}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={tl.check_time}
	{% else %}
	{tl.macro.resume} VELOCITY={tl.speed.travel}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=False
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{action_respond_info("Timelapse: Warning minimum extruder temperature not reached!")}
	{% else %}
	{% if tl.extruder.fw_retract %}
	G11
	{% else %}
	G0 E{tl.extruder.extrude} F{tl.speed.extrude * 60}
	G0 F{tl.restore.speed}
	{% if tl.restore.absolute.extrude %}
	M82
	G92 E{tl.restore.e}
	{% endif %}
	{% endif %}
	{% endif %}
	{% if tl.restore.factor.speed   != factor.speed   %} M220 S{(factor.speed*100)|round(0)}   {% endif %}
	{% if tl.restore.factor.extrude != factor.extrude %} M221 S{(factor.extrude*100)|round(0)} {% endif %}
	{% if not tl.restore.absolute.coordinates %} G91 {% endif %}
	{% endif %}

[gcode_macro HYPERLAPSE]
description = Start/Stop a hyperlapse recording
variable_cycle = 0
variable_run = False
gcode = 
	{% set cycle = params.CYCLE|default(30)|int %}
	{% if params.ACTION and params.ACTION|lower == 'start' %}
	{action_respond_info("Hyperlapse: frames started (Cycle %d sec)" % cycle)}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=True
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=cycle VALUE={cycle}
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True
	{% elif params.ACTION and params.ACTION|lower == 'stop' %}
	{% if run %}{action_respond_info("Hyperlapse: frames stopped")}{% endif %}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=False
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION=0
	{% else %}
	{action_raise_error("Hyperlapse: No valid input parameter
	Use:
	- HYPERLAPSE ACTION=START [CYCLE=time]
	- HYPERLAPSE ACTION=STOP")}
	{% endif %}

[delayed_gcode _HYPERLAPSE_LOOP]
gcode = 
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={printer["gcode_macro HYPERLAPSE"].cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True

[gcode_macro TIMELAPSE_RENDER]
description = Render Timelapse video and wait for the result
variable_render = False
variable_run_identifier = 0
gcode = 
	{action_respond_info("Timelapse: Rendering started")}
	{action_call_remote_method("timelapse_render", byrendermacro="True")}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=render VALUE=True
	{printer.configfile.settings['gcode_macro pause'].rename_existing}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5

[delayed_gcode _WAIT_TIMELAPSE_RENDER]
gcode = 
	{% set ri = printer['gcode_macro TIMELAPSE_RENDER'].run_identifier % 4 %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=run_identifier VALUE={ri + 1}
	{% if printer['gcode_macro TIMELAPSE_RENDER'].render %}
	M117 Rendering {['-','\\\\','|','/'][ri]}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5
	{% else %}
	{action_respond_info("Timelapse: Rendering finished")}
	M117
	{printer.configfile.settings['gcode_macro resume'].rename_existing}
	{% endif %}

[gcode_macro TEST_STREAM_DELAY]
description = Helper macro to find stream and park delay
gcode = 
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set act = printer.toolhead.position %}
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% if act.z > 5.0 %}
	G0 X{min.x + 5.0} F{tl.speed.travel|int * 60}
	G0 X{(max.x-min.x)/2}
	G4 P{tl.park.time|float * 1000}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE=FALSE
	G0 X{max.x - 5.0}
	{% else %}
	{action_raise_error("Toolhead z %.3f to low. Please place head above z = 5.0" % act.z)}
	{% endif %}

[gcode_macro PIDcalibrate]
gcode = 
	PID_CALIBRATE HEATER=extruder TARGET=235
	PID_CALIBRATE HEATER=heater_bed TARGET=80

[gcode_macro POWER_OFF_PRINTER]
gcode = 
	{action_call_remote_method( "set_device_power", device="printer_plug", state="off")}

[gcode_macro START_PRINT]
gcode = 
	{% set BED_TEMP = params.BED_TEMP|default(60)|float %}
	
	{% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(190)|float %}
	
	M140 S{BED_TEMP}
	
	G90
	
	G28
	
	G1 Z5 F3000
	BED_MESH_PROFILE LOAD=default
	
	M190 S{BED_TEMP}
	
	M109 S{EXTRUDER_TEMP}
	M117 Purge extruder
	G1 X25 Y20 Z0.3 F5000.0
	G1 X25 Y175.0 Z0.3 F1500.0 E15
	G1 X25 Y175.0 Z0.4 F5000.0
	G1 X25 Y20 Z0.4 F1500.0 E30
	G92 E0
	G1 Z1.0 F3000

[gcode_macro END_PRINT]
gcode = 
	
	M140 S0
	M104 S0
	
	M106 S0
	
	G91
	G1 X-2 Y-2 E-3 F300
	
	G1 Z10 F3000
	G90
	
	M84
	BED_MESH_CLEAR

[gcode_macro CALCULATE_BED_MESH]
description = Calculate bed_mesh boundaries automatically based on your bltouch/probe config
gcode = 
	{% set BED_MESH_MARGIN = params.BED_MESH_MARGIN|default(10)|float %}
	
	{% set X_MAX = printer.toolhead.axis_maximum.x|default(230)|float %}
	{% set Y_MAX = printer.toolhead.axis_maximum.y|default(230)|float %}
	
	{% set X_OFFSET = 0.0 |float %}
	{% set Y_OFFSET = 0.0 |float %}
	
	{% if printer.configfile.config["bltouch"] is defined %}
	{% set X_OFFSET = (printer.configfile.settings.bltouch.x_offset if printer.configfile.settings.bltouch.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.settings.bltouch.y_offset if printer.configfile.settings.bltouch.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	{% if printer.configfile.config["probe"] is defined %}
	{% set X_OFFSET = (printer.configfile.config.probe.x_offset if printer.configfile.config.probe.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.config.probe.y_offset if printer.configfile.config.probe.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	
	
	
	{% set BED_MESH_MIN_X = BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MIN_Y = BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_X = X_MAX - (X_OFFSET)|abs - BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_MAX - BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_Y = Y_MAX - (Y_OFFSET)|abs - BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_MAX - BED_MESH_MARGIN |float %}
	
	
	{action_respond_info("BED_MESH_MARGIN : %f" % (BED_MESH_MARGIN))}
	{action_respond_info("X_MAX           : %f" % (X_MAX))}
	{action_respond_info("Y_MAX           : %f" % (Y_MAX))}
	{action_respond_info("X_OFFSET        : %f" % (X_OFFSET))}
	{action_respond_info("Y_OFFSET        : %f" % (Y_OFFSET))}
	{action_respond_info("BED_MESH_MIN_X  : %f" % (BED_MESH_MIN_X))}
	{action_respond_info("BED_MESH_MIN_Y  : %f" % (BED_MESH_MIN_Y))}
	{action_respond_info("BED_MESH_MAX_X  : %f" % (BED_MESH_MAX_X))}
	{action_respond_info("BED_MESH_MAX_Y  : %f" % (BED_MESH_MAX_Y))}
	{action_respond_info("--- VALUES TO ADD OR UPDATE TO OUR BED_MESH VALUES ---")}
	{action_respond_info("--- VALORES PARA AGREGAR O ACTUALIZAR EN NUESTRA SECCIÓN BED_MESH ---")}
	{action_respond_info("mesh_max: %s,%s" % (BED_MESH_MAX_X,BED_MESH_MAX_Y))}
	{action_respond_info("mesh_min: %s,%s" % (BED_MESH_MIN_X,BED_MESH_MIN_Y))}

[gcode_macro PID_EXTRUDER]
description = PID Tune for the Extruder
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set T = params.TEMPERATURE|default(210)|float %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set P = printer.configfile.config[e].pid_kp|float %}
	{% set I = printer.configfile.config[e].pid_ki|float %}
	{% set D = printer.configfile.config[e].pid_kd|float %}
	M118 Homing...
	G28
	M106 S{S}
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Extruder PID calibration...
	PID_CALIBRATE HEATER={e} TARGET={T}
	TURN_OFF_HEATERS
	M107
	SAVE_CONFIG

[gcode_macro PID_BED]
description = PID Tune for the Bed
gcode = 
	{% set T = params.TEMPERATURE|default(60)|float %}
	{% set P = printer.configfile.config['heater_bed'].pid_kp|float %}
	{% set I = printer.configfile.config['heater_bed'].pid_ki|float %}
	{% set D = printer.configfile.config['heater_bed'].pid_kd|float %}
	M118 Homing...
	G28
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={T}
	TURN_OFF_HEATERS
	SAVE_CONFIG

[gcode_macro PID_ALL]
description = Heater and Bed temperature calibration. Usage: PID_ALL [TE=temperature] [TB=temperature]\\n Calibra la temperatura del extrusor y la cama. Uso: PID_ALL [TE=temperatura] [TB=temperature]
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set TE = params.TE|default(195)|int %}
	{% set TB = params.TB|default(45)|int %}
	M118 Homing...
	G28
	M118 Extruder PID calibration...
	M106 S{S}
	PID_CALIBRATE HEATER={e} TARGET={TE}
	M107
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={TB}
	SAVE_CONFIG

[tmc2209 stepper_x]
uart_pin = PE6
run_current = 0.9
diag_pin = ^PA15
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_y]
uart_pin = PE3
run_current = 0.9
diag_pin = ^PD2
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_z]
uart_pin = PB7
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 stepper_z1]
uart_pin = PD4
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 extruder]
uart_pin = PB3
run_current = 0.842
diag_pin = 
stealthchop_threshold = 0

[mcu eddy]
serial = /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00
restart_method = command

[temperature_sensor btt_eddy_mcu]
sensor_type = temperature_mcu
sensor_mcu = eddy
min_temp = 10
max_temp = 100

[probe_eddy_current btt_eddy]
sensor_type = ldc1612
z_offset = 2.5
i2c_mcu = eddy
i2c_bus = i2c0f
x_offset = -30
y_offset = 5
reg_drive_current = 16
calibrate = 
	0.050188:3205933.097,0.090337:3205145.727,0.130487:3204354.163,
	0.169383:3203615.123,0.209533:3202860.267,0.249683:3202120.825,
	0.289833:3201389.932,0.329983:3200675.781,0.370133:3199937.342,
	0.410283:3199271.075,0.450433:3198562.823,0.490583:3197906.664,
	0.529478:3197264.891,0.569628:3196643.334,0.609778:3195982.110,
	0.649928:3195394.352,0.690078:3194737.336,0.730228:3194161.411,
	0.770378:3193564.178,0.810528:3192980.830,0.849423:3192409.769,
	0.889573:3191874.493,0.929723:3191327.866,0.969873:3190787.673,
	1.010023:3190232.313,1.050173:3189727.474,1.090323:3189210.067,
	1.130473:3188739.481,1.170623:3188237.257,1.209519:3187753.422,
	1.249669:3187291.436,1.289819:3186821.547,1.329969:3186360.473,
	1.370119:3185924.800,1.410269:3185491.381,1.450419:3185053.330,
	1.490569:3184594.190,1.529464:3184205.277,1.569614:3183785.498,
	1.609764:3183350.340,1.649914:3182966.762,1.690064:3182588.711,
	1.730214:3182190.755,1.770364:3181813.670,1.810514:3181420.036,
	1.849409:3181087.634,1.889559:3180703.858,1.929709:3180363.438,
	1.969859:3180003.082,2.010009:3179664.903,2.050159:3179332.781,
	2.090309:3178990.508,2.130459:3178673.256,2.170609:3178345.224,
	2.209505:3178050.416,2.249655:3177734.057,2.289805:3177419.463,
	2.329955:3177136.203,2.370105:3176837.527,2.410255:3176546.139,
	2.450405:3176268.706,2.490555:3175972.146,2.529450:3175723.811,
	2.569600:3175470.080,2.609750:3175223.081,2.649900:3174962.842,
	2.690050:3174704.198,2.730200:3174460.913,2.770350:3174228.920,
	2.810500:3173989.118,2.849395:3173761.350,2.889545:3173516.616,
	2.929695:3173309.604,2.969845:3173089.770,3.009995:3172877.982,
	3.050145:3172644.639,3.090295:3172452.377,3.130445:3172252.422,
	3.170595:3172031.650,3.209491:3171857.260,3.249641:3171650.997,
	3.289791:3171441.897,3.329941:3171248.522,3.370091:3171071.032,
	3.410241:3170902.167,3.450391:3170700.892,3.490541:3170509.888,
	3.529436:3170367.070,3.569586:3170188.460,3.609736:3170015.379,
	3.649886:3169825.355,3.690036:3169687.899,3.730186:3169514.422,
	3.770336:3169378.249,3.810486:3169199.096,3.849381:3169055.600,
	3.889531:3168906.908,3.929681:3168770.855,3.969831:3168587.431,
	4.009981:3168461.835,4.050131:3168313.942

[temperature_probe btt_eddy]
sensor_type = Generic 3950
sensor_pin = eddy:gpio26
horizontal_move_z = 2
calibration_temp = 29.941653
drift_calibration = 
	3322659.134314, -5564.540372, 60.398093
	3204466.582019, -381.239579, 3.440192
	3191594.449302, -119.470102, 1.125202
	3183159.664481, 17.721542, -0.153070
	3176791.037916, 107.407930, -0.957123
	3171474.720102, 190.159212, -1.751515
	3166582.715676, 281.955770, -2.675074
	3163316.106670, 318.670366, -2.988620
	3160957.710763, 338.412885, -3.164299
drift_calibration_min_temp = 33.83103284492943

[bed_mesh]
speed = 50
horizontal_move_z = 1
mesh_min = 50,60
mesh_max = 280, 310
probe_count = 9, 9
mesh_pps = 3, 3
algorithm = bicubic
bicubic_tension = 0.2

[safe_z_home]
home_xy_position = 204, 185
speed = 50
z_hop = 10
z_hop_speed = 10

[save_variables]
filename = ~/printer_data/config/variables.cfg

[force_move]
enable_force_move = True

[delayed_gcode RESTORE_PROBE_OFFSET]
initial_duration = 1.
gcode = 
	{% set svv = printer.save_variables.variables %}
	{% if not printer["gcode_macro SET_GCODE_OFFSET"].restored %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ svv.nvm_offset|default(0) }
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=restored VALUE=True
	{% endif %}

[gcode_macro G28]
rename_existing = G28.1
gcode = 
	
	G28.1 {rawparams}
	{% if not rawparams or (rawparams and 'Z' in rawparams) %}
	PROBE
	SET_Z_FROM_PROBE
	{% endif %}

[gcode_macro SET_Z_FROM_PROBE]
gcode = 
	{% set cf = printer.configfile.settings %}
	SET_GCODE_OFFSET_ORIG Z={printer.probe.last_z_result - cf['probe_eddy_current btt_eddy'].z_offset + printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset}
	G90
	G1 Z{cf.safe_z_home.z_hop}

[gcode_macro Z_OFFSET_APPLY_PROBE]
rename_existing = Z_OFFSET_APPLY_PROBE_ORIG
gcode = 
	SAVE_VARIABLE VARIABLE=nvm_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset }

[gcode_macro SET_GCODE_OFFSET]
rename_existing = SET_GCODE_OFFSET_ORIG
variable_restored = False
variable_runtime_offset = 0
gcode = 
	{% if params.Z_ADJUST %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset + params.Z_ADJUST|float }
	{% endif %}
	{% if params.Z %}
	{% set paramList = rawparams.split() %}
	{% for i in range(paramList|length) %}
	{% if paramList[i]=="Z=0" %}
	{% set temp=paramList.pop(i) %}
	{% set temp="Z_ADJUST=" + (-printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset)|string %}
	{% if paramList.append(temp) %}{% endif %}
	{% endif %}
	{% endfor %}
	{% set rawparams=paramList|join(' ') %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE=0
	{% endif %}
	SET_GCODE_OFFSET_ORIG { rawparams }

[gcode_macro PROBE_EDDY_CURRENT_CALIBRATE_AUTO]
gcode = 
	BED_MESH_CLEAR
	G28 X Y
	G90
	G1 X{ printer.toolhead.axis_maximum.x/2 } Y{ printer.toolhead.axis_maximum.y/2 } F6000
	{% if 'z' not in printer.toolhead.homed_axes %}
	SET_KINEMATIC_POSITION Z={ printer.toolhead.axis_maximum.z-1 }
	{% endif %}
	PROBE_EDDY_CURRENT_CALIBRATE {rawparams}

[mcu]
serial = /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00

[stepper_x]
step_pin = PC14
dir_pin = !PC13
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA14
position_endstop = 0
position_min = 0
position_max = 330
homing_speed = 50

[stepper_y]
step_pin = PE5
dir_pin = PE4
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA15
position_endstop = 0
position_min = 0
position_max = 320
homing_speed = 50

[stepper_z1]
step_pin = PE1
dir_pin = PE0
enable_pin = !PE2
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop

[stepper_z]
step_pin = PD6
dir_pin = PD5
enable_pin = !PD7
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop
position_max = 400
position_min = -5
homing_speed = 10

[screws_tilt_adjust]
screw1 = 204,185
screw1_name = Central screw
screw2 = 105,84
screw2_name = Front left screw
screw3 = 305,84
screw3_name = Rear left screw
screw4 = 305,284
screw4_name = Front right screw
screw5 = 105, 284
screw5_name = Rear right screw
horizontal_move_z = 10
speed = 100
screw_thread = CW-M3

[bed_screws]
screw1 = 50,70
screw2 = 250,70
screw3 = 250, 230
screw4 = 50, 230

[z_tilt]
z_positions = -60, 155
	330, 155
points = 70, 184
	300, 184
speed = 100
horizontal_move_z = 10
retries = 8
retry_tolerance = 0.005

[extruder]
step_pin = PB5
dir_pin = !PB4
enable_pin = !PB6
microsteps = 16
rotation_distance = 8.06
nozzle_diameter = 0.400
filament_diameter = 1.750
heater_pin = PB1
sensor_type = ATC Semitec 104GT-2
sensor_pin = PC1
max_extrude_only_distance = 100000
min_temp = 0
max_temp = 260
pressure_advance = 0.08
control = pid
pid_kp = 39.588
pid_ki = 7.762
pid_kd = 50.475

[heater_bed]
heater_pin = PB10
sensor_type = ATC Semitec 104NT-4-R025H42G
sensor_pin = PC0
min_temp = 0
max_temp = 130
control = pid
pid_kp = 57.129
pid_ki = 2.026
pid_kd = 402.756
x_count = 4
y_count = 4
mesh_x_pps = 2
mesh_y_pps = 2
algo = bicubic
tension = 0.2
min_x = 40.0
max_x = 256.0
min_y = 60.0
max_y = 279.98999999999995

[fan]
pin = PA2
max_power = 1.0
off_below = 0.1

[heater_fan hotend]
pin = PA0
heater = extruder
heater_temp = 50.0
fan_speed = 1.0
shutdown_speed = 1.0

[printer]
kinematics = cartesian
max_velocity = 250
max_accel = 4500
max_z_velocity = 25
max_z_accel = 100

[skew_correction]

[bed_mesh default]
version = 1
points = 
	0.077380, 0.111423, 0.114676, 0.156457, 0.174093, 0.168682, 0.150091, 0.125241, 0.144394
	0.019770, 0.035236, 0.040041, 0.064163, 0.097841, 0.072235, 0.036121, 0.038328, -0.022320
	-0.046588, -0.004041, -0.002183, 0.034924, 0.056260, 0.057109, 0.025641, -0.003699, 0.000421
	-0.014058, -0.015146, -0.014967, 0.007296, 0.033845, 0.025323, -0.004179, -0.028621, -0.045631
	-0.053217, -0.062006, -0.048567, -0.019670, -0.003835, 0.000873, -0.021848, -0.046722, -0.038119
	-0.082454, -0.064824, -0.071665, -0.049962, -0.027577, -0.036043, -0.056768, -0.072205, -0.063067
	0.026282, -0.006652, -0.015925, 0.013883, 0.040249, 0.050473, 0.018200, -0.017486, -0.044483
	0.006865, 0.029730, 0.028595, 0.044249, 0.088176, 0.080421, 0.046590, 0.046284, 0.075516
	0.059874, -0.031578, -0.021740, 0.006004, 0.063576, 0.092164, 0.028281, -0.012436, -0.035619
x_count = 9
y_count = 9
mesh_x_pps = 3
mesh_y_pps = 3
algo = bicubic
tension = 0.2
min_x = 50.0
max_x = 280.0
min_y = 60.0
max_y = 310.0

[skew_correction mi_skew]
xy_skew = -0.00679190845337054
xz_skew = 0.0
yz_skew = 0.0
=======================
temperature_probe btt_eddy: loaded temperature drift calibration. Min Temp: 33.83, Min Freq: 3156001.351363
y(x) = 60.398093x^2 - 5564.540372x + 3322659.134314
y(x) = 3.440192x^2 - 381.239579x + 3204466.582019
y(x) = 1.125202x^2 - 119.470102x + 3191594.449302
y(x) = -0.153070x^2 + 17.721542x + 3183159.664481
y(x) = -0.957123x^2 + 107.407930x + 3176791.037916
y(x) = -1.751515x^2 + 190.159212x + 3171474.720102
y(x) = -2.675074x^2 + 281.955770x + 3166582.715676
y(x) = -2.988620x^2 + 318.670366x + 3163316.106670
y(x) = -3.164299x^2 + 338.412885x + 3160957.710763
temperature_probe btt_eddy: registered drift compensation with probe [probe_eddy_current btt_eddy]
Extruder max_extrude_ratio=0.266081
mcu 'mcu': Starting serial connect
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
webhooks client 548219240016: New connection
webhooks client 548219240016: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
Starting Klippy...
Args: ['/home/luis/klipper/klippy/klippy.py', '/home/luis/printer_data/config/printer.cfg', '-l', '/home/luis/printer_data/logs/klippy.log', '-I', '/home/luis/printer_data/comms/klippy.serial', '-a', '/home/luis/printer_data/comms/klippy.sock']
Git version: 'v0.13.0-320-gc80324946'
Branch: master
Remote: origin
Tracked URL: https://github.com/Klipper3d/klipper.git
CPU: 4 core ?
Device: Raspberry Pi 3 Model B Plus Rev 1.3
Linux: Linux version 6.12.47+rpt-rpi-v8 (serge@raspberrypi.com) (aarch64-linux-gnu-gcc-12 (Debian 12.2.0-14+deb12u1) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT Debian 1:6.12.47-1+rpt1~bookworm (2025-09-16)
Python: '3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]'
Start printer at Thu Jan  8 15:49:18 2026 (1767887358.4 36.1)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if last_extruder_temp.restore %}
	
	RESPOND TYPE=echo MSG='{"Restoring \\"%s\\" temperature to %3.1f\\u00B0C, this may take some time" % (printer.toolhead.extruder, last_extruder_temp.temp) }'
	M109 S{last_extruder_temp.temp}
	{% set do_resume = True %}
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	{% if runout_resume %}
	{% if do_resume %}
	{% if restore_idle_timeout > 0 %} SET_IDLE_TIMEOUT TIMEOUT={restore_idle_timeout} {% endif %}
	{client.user_resume_macro|default("")}
	_CLIENT_EXTRUDE
	RESUME_BASE VELOCITY={params.VELOCITY|default(sp_move)}
	{% endif %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]}'
	{% set _d = prompt_txt.append("\\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]) %}
	{% endif %}
	
	{% if not (runout_resume and do_resume) %}
	RESPOND TYPE=command MSG="action:prompt_begin RESUME aborted !!!"
	{% for element in prompt_txt %}
	RESPOND TYPE=command MSG='{"action:prompt_text %s" % element}'
	{% endfor %}
	RESPOND TYPE=command MSG="action:prompt_footer_button Ok|RESPOND TYPE=command MSG=action:prompt_end|info"
	RESPOND TYPE=command MSG="action:prompt_show"
	{% endif %}

[gcode_macro SET_PAUSE_NEXT_LAYER]
description = Enable a pause if the next layer is reached
gcode = 
	{% set pause_next_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_next_layer %}
	{% set ENABLE = params.ENABLE|default(1)|int != 0 %}
	{% set MACRO = params.MACRO|default(pause_next_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_next_layer VALUE="{{ 'enable': ENABLE, 'call': MACRO }}"

[gcode_macro SET_PAUSE_AT_LAYER]
description = Enable/disable a pause if a given layer number is reached
gcode = 
	{% set pause_at_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_at_layer %}
	{% set ENABLE = params.ENABLE|int != 0 if params.ENABLE is defined
	else params.LAYER is defined %}
	{% set LAYER = params.LAYER|default(pause_at_layer.layer)|int %}
	{% set MACRO = params.MACRO|default(pause_at_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_at_layer VALUE="{{ 'enable': ENABLE, 'layer': LAYER, 'call': MACRO }}"

[gcode_macro SET_PRINT_STATS_INFO]
rename_existing = SET_PRINT_STATS_INFO_BASE
description = Overwrite, to get pause_next_layer and pause_at_layer feature
variable_pause_next_layer = { 'enable': False, 'call': "PAUSE" }
variable_pause_at_layer = { 'enable': False, 'layer': 0, 'call': "PAUSE" }
gcode = 
	{% if pause_next_layer.enable %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_next_layer" % pause_next_layer.call}'
	{pause_next_layer.call}
	SET_PAUSE_NEXT_LAYER ENABLE=0
	{% elif pause_at_layer.enable and params.CURRENT_LAYER is defined and params.CURRENT_LAYER|int == pause_at_layer.layer %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_at_layer [%d]" % (pause_at_layer.call, pause_at_layer.layer)}'
	{pause_at_layer.call}
	SET_PAUSE_AT_LAYER ENABLE=0
	{% endif %}
	SET_PRINT_STATS_INFO_BASE {rawparams}

[gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL]
description = Helper: park toolhead used in PAUSE and CANCEL_PRINT
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set use_custom     = client.use_custom_pos|default(false)|lower == 'true' %}
	{% set custom_park_x  = client.custom_park_x|default(0.0) %}
	{% set custom_park_y  = client.custom_park_y|default(0.0) %}
	{% set park_dz        = client.custom_park_dz|default(2.0)|abs %}
	{% set sp_hop         = client.speed_hop|default(15) * 60 %}
	{% set sp_move        = client.speed_move|default(velocity) * 60 %}
	
	{% set origin    = printer.gcode_move.homing_origin %}
	{% set act       = printer.gcode_move.gcode_position %}
	{% set max       = printer.toolhead.axis_maximum %}
	{% set cone      = printer.toolhead.cone_start_z|default(max.z) %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	
	{% set z_min = params.Z_MIN|default(0)|float %}
	{% set z_park = [[(act.z + park_dz), z_min]|max, (max.z - origin.z)]|min %}
	{% set x_park = params.X       if params.X is defined
	else custom_park_x  if use_custom
	else 0.0            if round_bed
	else (max.x - 5.0) %}
	{% set y_park = params.Y       if params.Y is defined
	else custom_park_y  if use_custom
	else (max.y - 5.0)  if round_bed and z_park < cone
	else 0.0            if round_bed
	else (max.y - 5.0) %}
	
	_CLIENT_RETRACT
	{% if "xyz" in printer.toolhead.homed_axes %}
	G90
	G1 Z{z_park} F{sp_hop}
	G1 X{x_park} Y{y_park} F{sp_move}
	{% if not printer.gcode_move.absolute_coordinates %} G91 {% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='Printer not homed'
	{% endif %}

[gcode_macro _CLIENT_EXTRUDE]
description = Extrudes, if the extruder is hot enough
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set use_fw_retract = (client.use_fw_retract|default(false)|lower == 'true') and (printer.firmware_retraction is defined) %}
	{% set length = params.LENGTH|default(client.unretract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_unretract)|default(35) %}
	{% set absolute_extrude = printer.gcode_move.absolute_extrude %}
	
	{% if printer.toolhead.extruder != '' %}
	{% if printer[printer.toolhead.extruder].can_extrude %}
	{% if use_fw_retract %}
	{% if length < 0 %}
	G10
	{% else %}
	G11
	{% endif %}
	{% else %}
	M83
	G1 E{length} F{(speed|float|abs) * 60}
	{% if absolute_extrude %}
	M82
	{% endif %}
	{% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='{"\\"%s\\" not hot enough" % printer.toolhead.extruder}'
	{% endif %}
	{% endif %}

[gcode_macro _CLIENT_RETRACT]
description = Retracts, if the extruder is hot enough
gcode = 
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set length = params.LENGTH|default(client.retract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_retract)|default(35) %}
	
	_CLIENT_EXTRUDE LENGTH=-{length|float|abs} SPEED={speed|float|abs}

[gcode_macro _CLIENT_LINEAR_MOVE]
description = Linear move with save and restore of the gcode state
gcode = 
	{% set x_move = "X" ~ params.X if params.X is defined else "" %}
	{% set y_move = "Y" ~ params.Y if params.Y is defined else "" %}
	{% set z_move = "Z" ~ params.Z if params.Z is defined else "" %}
	{% set e_move = "E" ~ params.E if params.E is defined else "" %}
	{% set rate = "F" ~ params.F if params.F is defined else "" %}
	{% set ABSOLUTE = params.ABSOLUTE | default(0) | int != 0 %}
	{% set ABSOLUTE_E = params.ABSOLUTE_E | default(0) | int != 0 %}
	SAVE_GCODE_STATE NAME=_client_movement
	{% if x_move or y_move or z_move %}
	G9{ 0 if ABSOLUTE else 1 }
	{% endif %}
	{% if e_move %}
	M8{ 2 if ABSOLUTE_E else 3 }
	{% endif %}
	G1 { x_move } { y_move } { z_move } { e_move } { rate }
	RESTORE_GCODE_STATE NAME=_client_movement

[gcode_macro GET_TIMELAPSE_SETUP]
description = Print the Timelapse setup
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set output_txt = ["Timelapse Setup:"] %}
	{% set _dummy = output_txt.append("enable: %s" % tl.enable) %}
	{% set _dummy = output_txt.append("park: %s" % tl.park.enable) %}
	{% if tl.park.enable %}
	{% set _dummy = output_txt.append("park position: %s time: %s s" % (tl.park.pos, tl.park.time)) %}
	{% set _dummy = output_txt.append("park cord x:%s y:%s dz:%s" % (tl.park.coord.x, tl.park.coord.y, tl.park.coord.dz)) %}
	{% set _dummy = output_txt.append("travel speed: %s mm/s" % tl.speed.travel) %}
	{% endif %}
	{% set _dummy = output_txt.append("fw_retract: %s" % tl.extruder.fw_retract) %}
	{% if not tl.extruder.fw_retract %}
	{% set _dummy = output_txt.append("retract: %s mm speed: %s mm/s" % (tl.extruder.retract, tl.speed.retract)) %}
	{% set _dummy = output_txt.append("extrude: %s mm speed: %s mm/s" % (tl.extruder.extrude, tl.speed.extrude)) %}
	{% endif %}
	{% set _dummy = output_txt.append("verbose: %s" % tl.verbose) %}
	{action_respond_info(output_txt|join("\\n"))}

[gcode_macro _SET_TIMELAPSE_SETUP]
description = Set user parameters for timelapse
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	{% set park = {'min'   : {'x': (min.x / 1.42)|round(3) if round_bed else min.x|round(3),
	'y': (min.y / 1.42)|round(3) if round_bed else min.y|round(3)},
	'max'   : {'x': (max.x / 1.42)|round(3) if round_bed else max.x|round(3),
	'y': (max.y / 1.42)|round(3) if round_bed else max.y|round(3)},
	'center': {'x': (max.x-(max.x-min.x)/2)|round(3),
	'y': (max.y-(max.y-min.y)/2)|round(3)}} %}
	
	{% if params.ENABLE %}
	{% if params.ENABLE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=enable VALUE={True if params.ENABLE|lower == 'true' else False}
	{% else %}
	{action_raise_error("ENABLE=%s not supported. Allowed values are [True, False]" % params.ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.VERBOSE %}
	{% if params.VERBOSE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=verbose VALUE={True if params.VERBOSE|lower == 'true' else False}
	{% else %}
	{action_raise_error("VERBOSE=%s not supported. Allowed values are [True, False]" % params.VERBOSE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_X %}
	{% if params.CUSTOM_POS_X|float >= min.x and params.CUSTOM_POS_X|float <= max.x %}
	{% set _dummy = tl.park.custom.update({'x':params.CUSTOM_POS_X|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_X=%s must be within [%s - %s]" % (params.CUSTOM_POS_X, min.x, max.x))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_Y %}
	{% if params.CUSTOM_POS_Y|float >= min.y and params.CUSTOM_POS_Y|float <= max.y %}
	{% set _dummy = tl.park.custom.update({'y':params.CUSTOM_POS_Y|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_Y=%s must be within [%s - %s]" % (params.CUSTOM_POS_Y, min.y, max.y))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_DZ %}
	{% if params.CUSTOM_POS_DZ|float >= min.z and params.CUSTOM_POS_DZ|float <= max.z %}
	{% set _dummy = tl.park.custom.update({'dz':params.CUSTOM_POS_DZ|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_DZ=%s must be within [%s - %s]" % (params.CUSTOM_POS_DZ, min.z, max.z))}
	{% endif %}
	{% endif %}
	{% if params.PARK_ENABLE %}
	{% if params.PARK_ENABLE|lower is in ['true', 'false'] %}
	{% set _dummy = tl.park.update({'enable':True if params.PARK_ENABLE|lower == 'true' else False}) %}
	{% else %}
	{action_raise_error("PARK_ENABLE=%s not supported. Allowed values are [True, False]" % params.PARK_ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.PARK_POS %}
	{% if params.PARK_POS|lower is in ['center','front_left','front_right','back_left','back_right','custom','x_only','y_only'] %}
	{% set dic = {'center'      : {'x': park.center.x   , 'y': park.center.y   , 'dz': 1                },
	'front_left'  : {'x': park.min.x      , 'y': park.min.y      , 'dz': 0                },
	'front_right' : {'x': park.max.x      , 'y': park.min.y      , 'dz': 0                },
	'back_left'   : {'x': park.min.x      , 'y': park.max.y      , 'dz': 0                },
	'back_right'  : {'x': park.max.x      , 'y': park.max.y      , 'dz': 0                },
	'custom'      : {'x': tl.park.custom.x, 'y': tl.park.custom.y, 'dz': tl.park.custom.dz},
	'x_only'      : {'x': tl.park.custom.x, 'y': 'none'          , 'dz': tl.park.custom.dz},
	'y_only'      : {'x': 'none'          , 'y': tl.park.custom.y, 'dz': tl.park.custom.dz}} %}
	{% set _dummy = tl.park.update({'pos':params.PARK_POS|lower}) %}
	{% set _dummy = tl.park.update({'coord':dic[tl.park.pos]}) %}
	{% else %}
	{action_raise_error("PARK_POS=%s not supported. Allowed values are [CENTER, FRONT_LEFT, FRONT_RIGHT, BACK_LEFT, BACK_RIGHT, CUSTOM, X_ONLY, Y_ONLY]"
	% params.PARK_POS|upper)}
	{% endif %}
	{% endif %}
	{% if params.PARK_TIME %}
	{% if params.PARK_TIME|float >= 0.0 %}
	{% set _dummy = tl.park.update({'time':params.PARK_TIME|float|round(3)}) %}
	{% else %}
	{action_raise_error("PARK_TIME=%s must be a positive number" % params.PARK_TIME)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=park VALUE="{tl.park}"
	{% if params.TRAVEL_SPEED %}
	{% if params.TRAVEL_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'travel':params.TRAVEL_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("TRAVEL_SPEED=%s must be larger than 0" % params.TRAVEL_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_SPEED %}
	{% if params.RETRACT_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'retract':params.RETRACT_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_SPEED=%s must be larger than 0" % params.RETRACT_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.EXTRUDE_SPEED %}
	{% if params.EXTRUDE_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'extrude':params.EXTRUDE_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_SPEED=%s must be larger than 0" % params.EXTRUDE_SPEED)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=speed VALUE="{tl.speed}"
	{% if params.EXTRUDE_DISTANCE %}
	{% if params.EXTRUDE_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'extrude':params.EXTRUDE_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_DISTANCE=%s must be specified as positiv number" % params.EXTRUDE_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_DISTANCE %}
	{% if params.RETRACT_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'retract':params.RETRACT_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_DISTANCE=%s must be specified as positiv number" % params.RETRACT_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.FW_RETRACT %}
	{% if params.FW_RETRACT|lower is in ['true', 'false'] %}
	{% if 'firmware_retraction' in printer.configfile.settings %}
	{% set _dummy = tl.extruder.update({'fw_retract': True if params.FW_RETRACT|lower == 'true' else False}) %}
	{% else %}
	{% set _dummy = tl.extruder.update({'fw_retract':False}) %}
	{% if params.FW_RETRACT|capitalize == 'True' %}
	{action_raise_error("[firmware_retraction] not defined in printer.cfg. Can not enable fw_retract")}
	{% endif %}
	{% endif %}
	{% else %}
	{action_raise_error("FW_RETRACT=%s not supported. Allowed values are [True, False]" % params.FW_RETRACT|capitalize)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=extruder VALUE="{tl.extruder}"
	{% if printer.configfile.settings['gcode_macro pause'] is defined %}
	{% set _dummy = tl.macro.update({'pause': printer.configfile.settings['gcode_macro pause'].rename_existing}) %}
	{% endif %}
	{% if printer.configfile.settings['gcode_macro resume'] is defined %}
	{% set _dummy = tl.macro.update({'resume': printer.configfile.settings['gcode_macro resume'].rename_existing}) %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=macro VALUE="{tl.macro}"

[gcode_macro TIMELAPSE_TAKE_FRAME]
description = Take Timelapse shoot
variable_enable = False
variable_takingframe = False
variable_park = {'enable': False,
	'pos'   : 'center',
	'time'  : 0.1,
	'custom': {'x': 0, 'y': 0, 'dz': 0},
	'coord' : {'x': 0, 'y': 0, 'dz': 0}}
variable_extruder = {'fw_retract': False,
	'retract': 1.0,
	'extrude': 1.0}
variable_speed = {'travel': 100,
	'retract': 15,
	'extrude': 15}
variable_verbose = True
variable_check_time = 0.5
variable_restore = {'absolute': {'coordinates': True, 'extrude': True}, 'speed': 1500, 'e':0, 'factor': {'speed': 1.0, 'extrude': 1.0}}
variable_macro = {'pause': 'PAUSE', 'resume': 'RESUME'}
variable_is_paused = False
gcode = 
	{% set hyperlapse = True if params.HYPERLAPSE and params.HYPERLAPSE|lower =='true' else False %}
	{% if enable %}
	{% if (hyperlapse and printer['gcode_macro HYPERLAPSE'].run) or
	(not hyperlapse and not printer['gcode_macro HYPERLAPSE'].run) %}
	{% if park.enable %}
	{% set pos = {'x': 'X' + park.coord.x|string if park.pos != 'y_only' else '',
	'y': 'Y' + park.coord.y|string if park.pos != 'x_only' else '',
	'z': 'Z'+ [printer.gcode_move.gcode_position.z + park.coord.dz, printer.toolhead.axis_maximum.z]|min|string} %}
	{% set restore = {'absolute': {'coordinates': printer.gcode_move.absolute_coordinates,
	'extrude'    : printer.gcode_move.absolute_extrude},
	'speed'   : printer.gcode_move.speed,
	'e'       : printer.gcode_move.gcode_position.e,
	'factor'  : {'speed'  : printer.gcode_move.speed_factor,
	'extrude': printer.gcode_move.extrude_factor}} %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=restore VALUE="{restore}"
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, minimum extruder temperature not reached!")}{% endif %}
	{% else %}
	{% if extruder.fw_retract %}
	G10
	{% else %}
	M83
	G0 E-{extruder.retract} F{speed.retract * 60}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=True
	{macro.pause}
	SET_GCODE_OFFSET X=0 Y=0
	G90
	{% if "xyz" not in printer.toolhead.homed_axes %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, axis not homed yet!")}{% endif %}
	{% else %}
	G0 {pos.x} {pos.y} {pos.z} F{speed.travel * 60}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=takingframe VALUE=True
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={check_time}
	M400
	{% endif %}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE={hyperlapse}
	{% endif %}
	{% else %}
	{% if verbose %}{action_respond_info("Timelapse: disabled, take frame ignored")}{% endif %}
	{% endif %}

[gcode_macro _TIMELAPSE_NEW_FRAME]
description = action call for timelapse shoot. must be a seperate macro
gcode = 
	{action_call_remote_method("timelapse_newframe",
	macropark=printer['gcode_macro TIMELAPSE_TAKE_FRAME'].park,
	hyperlapse=params.HYPERLAPSE)}

[delayed_gcode _WAIT_TIMELAPSE_TAKE_FRAME]
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set factor = {'speed': printer.gcode_move.speed_factor, 'extrude': printer.gcode_move.extrude_factor} %}
	{% if tl.takingframe %}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={tl.check_time}
	{% else %}
	{tl.macro.resume} VELOCITY={tl.speed.travel}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=False
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{action_respond_info("Timelapse: Warning minimum extruder temperature not reached!")}
	{% else %}
	{% if tl.extruder.fw_retract %}
	G11
	{% else %}
	G0 E{tl.extruder.extrude} F{tl.speed.extrude * 60}
	G0 F{tl.restore.speed}
	{% if tl.restore.absolute.extrude %}
	M82
	G92 E{tl.restore.e}
	{% endif %}
	{% endif %}
	{% endif %}
	{% if tl.restore.factor.speed   != factor.speed   %} M220 S{(factor.speed*100)|round(0)}   {% endif %}
	{% if tl.restore.factor.extrude != factor.extrude %} M221 S{(factor.extrude*100)|round(0)} {% endif %}
	{% if not tl.restore.absolute.coordinates %} G91 {% endif %}
	{% endif %}

[gcode_macro HYPERLAPSE]
description = Start/Stop a hyperlapse recording
variable_cycle = 0
variable_run = False
gcode = 
	{% set cycle = params.CYCLE|default(30)|int %}
	{% if params.ACTION and params.ACTION|lower == 'start' %}
	{action_respond_info("Hyperlapse: frames started (Cycle %d sec)" % cycle)}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=True
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=cycle VALUE={cycle}
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True
	{% elif params.ACTION and params.ACTION|lower == 'stop' %}
	{% if run %}{action_respond_info("Hyperlapse: frames stopped")}{% endif %}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=False
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION=0
	{% else %}
	{action_raise_error("Hyperlapse: No valid input parameter
	Use:
	- HYPERLAPSE ACTION=START [CYCLE=time]
	- HYPERLAPSE ACTION=STOP")}
	{% endif %}

[delayed_gcode _HYPERLAPSE_LOOP]
gcode = 
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={printer["gcode_macro HYPERLAPSE"].cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True

[gcode_macro TIMELAPSE_RENDER]
description = Render Timelapse video and wait for the result
variable_render = False
variable_run_identifier = 0
gcode = 
	{action_respond_info("Timelapse: Rendering started")}
	{action_call_remote_method("timelapse_render", byrendermacro="True")}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=render VALUE=True
	{printer.configfile.settings['gcode_macro pause'].rename_existing}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5

[delayed_gcode _WAIT_TIMELAPSE_RENDER]
gcode = 
	{% set ri = printer['gcode_macro TIMELAPSE_RENDER'].run_identifier % 4 %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=run_identifier VALUE={ri + 1}
	{% if printer['gcode_macro TIMELAPSE_RENDER'].render %}
	M117 Rendering {['-','\\\\','|','/'][ri]}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5
	{% else %}
	{action_respond_info("Timelapse: Rendering finished")}
	M117
	{printer.configfile.settings['gcode_macro resume'].rename_existing}
	{% endif %}

[gcode_macro TEST_STREAM_DELAY]
description = Helper macro to find stream and park delay
gcode = 
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set act = printer.toolhead.position %}
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% if act.z > 5.0 %}
	G0 X{min.x + 5.0} F{tl.speed.travel|int * 60}
	G0 X{(max.x-min.x)/2}
	G4 P{tl.park.time|float * 1000}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE=FALSE
	G0 X{max.x - 5.0}
	{% else %}
	{action_raise_error("Toolhead z %.3f to low. Please place head above z = 5.0" % act.z)}
	{% endif %}

[gcode_macro PIDcalibrate]
gcode = 
	PID_CALIBRATE HEATER=extruder TARGET=235
	PID_CALIBRATE HEATER=heater_bed TARGET=80

[gcode_macro POWER_OFF_PRINTER]
gcode = 
	{action_call_remote_method( "set_device_power", device="printer_plug", state="off")}

[gcode_macro START_PRINT]
gcode = 
	{% set BED_TEMP = params.BED_TEMP|default(60)|float %}
	
	{% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(190)|float %}
	
	M140 S{BED_TEMP}
	
	G90
	
	G28
	
	G1 Z5 F3000
	BED_MESH_PROFILE LOAD=default
	
	M190 S{BED_TEMP}
	
	M109 S{EXTRUDER_TEMP}
	M117 Purge extruder
	G1 X25 Y20 Z0.3 F5000.0
	G1 X25 Y175.0 Z0.3 F1500.0 E15
	G1 X25 Y175.0 Z0.4 F5000.0
	G1 X25 Y20 Z0.4 F1500.0 E30
	G92 E0
	G1 Z1.0 F3000

[gcode_macro END_PRINT]
gcode = 
	
	M140 S0
	M104 S0
	
	M106 S0
	
	G91
	G1 X-2 Y-2 E-3 F300
	
	G1 Z10 F3000
	G90
	
	M84
	BED_MESH_CLEAR

[gcode_macro CALCULATE_BED_MESH]
description = Calculate bed_mesh boundaries automatically based on your bltouch/probe config
gcode = 
	{% set BED_MESH_MARGIN = params.BED_MESH_MARGIN|default(10)|float %}
	
	{% set X_MAX = printer.toolhead.axis_maximum.x|default(230)|float %}
	{% set Y_MAX = printer.toolhead.axis_maximum.y|default(230)|float %}
	
	{% set X_OFFSET = 0.0 |float %}
	{% set Y_OFFSET = 0.0 |float %}
	
	{% if printer.configfile.config["bltouch"] is defined %}
	{% set X_OFFSET = (printer.configfile.settings.bltouch.x_offset if printer.configfile.settings.bltouch.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.settings.bltouch.y_offset if printer.configfile.settings.bltouch.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	{% if printer.configfile.config["probe"] is defined %}
	{% set X_OFFSET = (printer.configfile.config.probe.x_offset if printer.configfile.config.probe.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.config.probe.y_offset if printer.configfile.config.probe.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	
	
	
	{% set BED_MESH_MIN_X = BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MIN_Y = BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_X = X_MAX - (X_OFFSET)|abs - BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_MAX - BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_Y = Y_MAX - (Y_OFFSET)|abs - BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_MAX - BED_MESH_MARGIN |float %}
	
	
	{action_respond_info("BED_MESH_MARGIN : %f" % (BED_MESH_MARGIN))}
	{action_respond_info("X_MAX           : %f" % (X_MAX))}
	{action_respond_info("Y_MAX           : %f" % (Y_MAX))}
	{action_respond_info("X_OFFSET        : %f" % (X_OFFSET))}
	{action_respond_info("Y_OFFSET        : %f" % (Y_OFFSET))}
	{action_respond_info("BED_MESH_MIN_X  : %f" % (BED_MESH_MIN_X))}
	{action_respond_info("BED_MESH_MIN_Y  : %f" % (BED_MESH_MIN_Y))}
	{action_respond_info("BED_MESH_MAX_X  : %f" % (BED_MESH_MAX_X))}
	{action_respond_info("BED_MESH_MAX_Y  : %f" % (BED_MESH_MAX_Y))}
	{action_respond_info("--- VALUES TO ADD OR UPDATE TO OUR BED_MESH VALUES ---")}
	{action_respond_info("--- VALORES PARA AGREGAR O ACTUALIZAR EN NUESTRA SECCIÓN BED_MESH ---")}
	{action_respond_info("mesh_max: %s,%s" % (BED_MESH_MAX_X,BED_MESH_MAX_Y))}
	{action_respond_info("mesh_min: %s,%s" % (BED_MESH_MIN_X,BED_MESH_MIN_Y))}

[gcode_macro PID_EXTRUDER]
description = PID Tune for the Extruder
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set T = params.TEMPERATURE|default(210)|float %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set P = printer.configfile.config[e].pid_kp|float %}
	{% set I = printer.configfile.config[e].pid_ki|float %}
	{% set D = printer.configfile.config[e].pid_kd|float %}
	M118 Homing...
	G28
	M106 S{S}
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Extruder PID calibration...
	PID_CALIBRATE HEATER={e} TARGET={T}
	TURN_OFF_HEATERS
	M107
	SAVE_CONFIG

[gcode_macro PID_BED]
description = PID Tune for the Bed
gcode = 
	{% set T = params.TEMPERATURE|default(60)|float %}
	{% set P = printer.configfile.config['heater_bed'].pid_kp|float %}
	{% set I = printer.configfile.config['heater_bed'].pid_ki|float %}
	{% set D = printer.configfile.config['heater_bed'].pid_kd|float %}
	M118 Homing...
	G28
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={T}
	TURN_OFF_HEATERS
	SAVE_CONFIG

[gcode_macro PID_ALL]
description = Heater and Bed temperature calibration. Usage: PID_ALL [TE=temperature] [TB=temperature]\\n Calibra la temperatura del extrusor y la cama. Uso: PID_ALL [TE=temperatura] [TB=temperature]
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set TE = params.TE|default(195)|int %}
	{% set TB = params.TB|default(45)|int %}
	M118 Homing...
	G28
	M118 Extruder PID calibration...
	M106 S{S}
	PID_CALIBRATE HEATER={e} TARGET={TE}
	M107
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={TB}
	SAVE_CONFIG

[tmc2209 stepper_x]
uart_pin = PE6
run_current = 0.9
diag_pin = ^PA15
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_y]
uart_pin = PE3
run_current = 0.9
diag_pin = ^PD2
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_z]
uart_pin = PB7
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 stepper_z1]
uart_pin = PD4
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 extruder]
uart_pin = PB3
run_current = 0.842
diag_pin = 
stealthchop_threshold = 0

[mcu eddy]
serial = /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00
restart_method = command

[temperature_sensor btt_eddy_mcu]
sensor_type = temperature_mcu
sensor_mcu = eddy
min_temp = 10
max_temp = 100

[probe_eddy_current btt_eddy]
sensor_type = ldc1612
z_offset = 2.5
i2c_mcu = eddy
i2c_bus = i2c0f
x_offset = -30
y_offset = 5
reg_drive_current = 16
calibrate = 
	0.050188:3205933.097,0.090337:3205145.727,0.130487:3204354.163,
	0.169383:3203615.123,0.209533:3202860.267,0.249683:3202120.825,
	0.289833:3201389.932,0.329983:3200675.781,0.370133:3199937.342,
	0.410283:3199271.075,0.450433:3198562.823,0.490583:3197906.664,
	0.529478:3197264.891,0.569628:3196643.334,0.609778:3195982.110,
	0.649928:3195394.352,0.690078:3194737.336,0.730228:3194161.411,
	0.770378:3193564.178,0.810528:3192980.830,0.849423:3192409.769,
	0.889573:3191874.493,0.929723:3191327.866,0.969873:3190787.673,
	1.010023:3190232.313,1.050173:3189727.474,1.090323:3189210.067,
	1.130473:3188739.481,1.170623:3188237.257,1.209519:3187753.422,
	1.249669:3187291.436,1.289819:3186821.547,1.329969:3186360.473,
	1.370119:3185924.800,1.410269:3185491.381,1.450419:3185053.330,
	1.490569:3184594.190,1.529464:3184205.277,1.569614:3183785.498,
	1.609764:3183350.340,1.649914:3182966.762,1.690064:3182588.711,
	1.730214:3182190.755,1.770364:3181813.670,1.810514:3181420.036,
	1.849409:3181087.634,1.889559:3180703.858,1.929709:3180363.438,
	1.969859:3180003.082,2.010009:3179664.903,2.050159:3179332.781,
	2.090309:3178990.508,2.130459:3178673.256,2.170609:3178345.224,
	2.209505:3178050.416,2.249655:3177734.057,2.289805:3177419.463,
	2.329955:3177136.203,2.370105:3176837.527,2.410255:3176546.139,
	2.450405:3176268.706,2.490555:3175972.146,2.529450:3175723.811,
	2.569600:3175470.080,2.609750:3175223.081,2.649900:3174962.842,
	2.690050:3174704.198,2.730200:3174460.913,2.770350:3174228.920,
	2.810500:3173989.118,2.849395:3173761.350,2.889545:3173516.616,
	2.929695:3173309.604,2.969845:3173089.770,3.009995:3172877.982,
	3.050145:3172644.639,3.090295:3172452.377,3.130445:3172252.422,
	3.170595:3172031.650,3.209491:3171857.260,3.249641:3171650.997,
	3.289791:3171441.897,3.329941:3171248.522,3.370091:3171071.032,
	3.410241:3170902.167,3.450391:3170700.892,3.490541:3170509.888,
	3.529436:3170367.070,3.569586:3170188.460,3.609736:3170015.379,
	3.649886:3169825.355,3.690036:3169687.899,3.730186:3169514.422,
	3.770336:3169378.249,3.810486:3169199.096,3.849381:3169055.600,
	3.889531:3168906.908,3.929681:3168770.855,3.969831:3168587.431,
	4.009981:3168461.835,4.050131:3168313.942

[temperature_probe btt_eddy]
sensor_type = Generic 3950
sensor_pin = eddy:gpio26
horizontal_move_z = 2
calibration_temp = 29.941653
drift_calibration = 
	3322659.134314, -5564.540372, 60.398093
	3204466.582019, -381.239579, 3.440192
	3191594.449302, -119.470102, 1.125202
	3183159.664481, 17.721542, -0.153070
	3176791.037916, 107.407930, -0.957123
	3171474.720102, 190.159212, -1.751515
	3166582.715676, 281.955770, -2.675074
	3163316.106670, 318.670366, -2.988620
	3160957.710763, 338.412885, -3.164299
drift_calibration_min_temp = 33.83103284492943

[bed_mesh]
speed = 50
horizontal_move_z = 1
mesh_min = 50,60
mesh_max = 280, 310
probe_count = 9, 9
mesh_pps = 3, 3
algorithm = bicubic
bicubic_tension = 0.2

[safe_z_home]
home_xy_position = 204, 185
speed = 50
z_hop = 10
z_hop_speed = 10

[save_variables]
filename = ~/printer_data/config/variables.cfg

[force_move]
enable_force_move = True

[delayed_gcode RESTORE_PROBE_OFFSET]
initial_duration = 1.
gcode = 
	{% set svv = printer.save_variables.variables %}
	{% if not printer["gcode_macro SET_GCODE_OFFSET"].restored %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ svv.nvm_offset|default(0) }
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=restored VALUE=True
	{% endif %}

[gcode_macro G28]
rename_existing = G28.1
gcode = 
	
	G28.1 {rawparams}
	{% if not rawparams or (rawparams and 'Z' in rawparams) %}
	PROBE
	SET_Z_FROM_PROBE
	{% endif %}

[gcode_macro SET_Z_FROM_PROBE]
gcode = 
	{% set cf = printer.configfile.settings %}
	SET_GCODE_OFFSET_ORIG Z={printer.probe.last_z_result - cf['probe_eddy_current btt_eddy'].z_offset + printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset}
	G90
	G1 Z{cf.safe_z_home.z_hop}

[gcode_macro Z_OFFSET_APPLY_PROBE]
rename_existing = Z_OFFSET_APPLY_PROBE_ORIG
gcode = 
	SAVE_VARIABLE VARIABLE=nvm_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset }

[gcode_macro SET_GCODE_OFFSET]
rename_existing = SET_GCODE_OFFSET_ORIG
variable_restored = False
variable_runtime_offset = 0
gcode = 
	{% if params.Z_ADJUST %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset + params.Z_ADJUST|float }
	{% endif %}
	{% if params.Z %}
	{% set paramList = rawparams.split() %}
	{% for i in range(paramList|length) %}
	{% if paramList[i]=="Z=0" %}
	{% set temp=paramList.pop(i) %}
	{% set temp="Z_ADJUST=" + (-printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset)|string %}
	{% if paramList.append(temp) %}{% endif %}
	{% endif %}
	{% endfor %}
	{% set rawparams=paramList|join(' ') %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE=0
	{% endif %}
	SET_GCODE_OFFSET_ORIG { rawparams }

[gcode_macro PROBE_EDDY_CURRENT_CALIBRATE_AUTO]
gcode = 
	BED_MESH_CLEAR
	G28 X Y
	G90
	G1 X{ printer.toolhead.axis_maximum.x/2 } Y{ printer.toolhead.axis_maximum.y/2 } F6000
	{% if 'z' not in printer.toolhead.homed_axes %}
	SET_KINEMATIC_POSITION Z={ printer.toolhead.axis_maximum.z-1 }
	{% endif %}
	PROBE_EDDY_CURRENT_CALIBRATE {rawparams}

[mcu]
serial = /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00

[stepper_x]
step_pin = PC14
dir_pin = !PC13
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA14
position_endstop = 0
position_min = 0
position_max = 330
homing_speed = 50

[stepper_y]
step_pin = PE5
dir_pin = PE4
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA15
position_endstop = 0
position_min = 0
position_max = 320
homing_speed = 50

[stepper_z1]
step_pin = PE1
dir_pin = PE0
enable_pin = !PE2
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop

[stepper_z]
step_pin = PD6
dir_pin = PD5
enable_pin = !PD7
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop
position_max = 400
position_min = -5
homing_speed = 10

[screws_tilt_adjust]
screw1 = 204,185
screw1_name = Central screw
screw2 = 105,84
screw2_name = Front left screw
screw3 = 305,84
screw3_name = Rear left screw
screw4 = 305,284
screw4_name = Front right screw
screw5 = 105, 284
screw5_name = Rear right screw
horizontal_move_z = 10
speed = 100
screw_thread = CW-M3

[bed_screws]
screw1 = 50,70
screw2 = 250,70
screw3 = 250, 230
screw4 = 50, 230

[z_tilt]
z_positions = -60, 155
	330, 155
points = 70, 184
	300, 184
speed = 100
horizontal_move_z = 10
retries = 8
retry_tolerance = 0.005

[extruder]
step_pin = PB5
dir_pin = !PB4
enable_pin = !PB6
microsteps = 16
rotation_distance = 8.06
nozzle_diameter = 0.400
filament_diameter = 1.750
heater_pin = PB1
sensor_type = ATC Semitec 104GT-2
sensor_pin = PC1
max_extrude_only_distance = 100000
min_temp = 0
max_temp = 260
pressure_advance = 0.08
control = pid
pid_kp = 39.588
pid_ki = 7.762
pid_kd = 50.475

[heater_bed]
heater_pin = PB10
sensor_type = ATC Semitec 104NT-4-R025H42G
sensor_pin = PC0
min_temp = 0
max_temp = 130
control = pid
pid_kp = 57.129
pid_ki = 2.026
pid_kd = 402.756
x_count = 4
y_count = 4
mesh_x_pps = 2
mesh_y_pps = 2
algo = bicubic
tension = 0.2
min_x = 40.0
max_x = 256.0
min_y = 60.0
max_y = 279.98999999999995

[fan]
pin = PA2
max_power = 1.0
off_below = 0.1

[heater_fan hotend]
pin = PA0
heater = extruder
heater_temp = 50.0
fan_speed = 1.0
shutdown_speed = 1.0

[printer]
kinematics = cartesian
max_velocity = 250
max_accel = 4500
max_z_velocity = 25
max_z_accel = 100

[skew_correction]

[bed_mesh default]
version = 1
points = 
	0.077380, 0.111423, 0.114676, 0.156457, 0.174093, 0.168682, 0.150091, 0.125241, 0.144394
	0.019770, 0.035236, 0.040041, 0.064163, 0.097841, 0.072235, 0.036121, 0.038328, -0.022320
	-0.046588, -0.004041, -0.002183, 0.034924, 0.056260, 0.057109, 0.025641, -0.003699, 0.000421
	-0.014058, -0.015146, -0.014967, 0.007296, 0.033845, 0.025323, -0.004179, -0.028621, -0.045631
	-0.053217, -0.062006, -0.048567, -0.019670, -0.003835, 0.000873, -0.021848, -0.046722, -0.038119
	-0.082454, -0.064824, -0.071665, -0.049962, -0.027577, -0.036043, -0.056768, -0.072205, -0.063067
	0.026282, -0.006652, -0.015925, 0.013883, 0.040249, 0.050473, 0.018200, -0.017486, -0.044483
	0.006865, 0.029730, 0.028595, 0.044249, 0.088176, 0.080421, 0.046590, 0.046284, 0.075516
	0.059874, -0.031578, -0.021740, 0.006004, 0.063576, 0.092164, 0.028281, -0.012436, -0.035619
x_count = 9
y_count = 9
mesh_x_pps = 3
mesh_y_pps = 3
algo = bicubic
tension = 0.2
min_x = 50.0
max_x = 280.0
min_y = 60.0
max_y = 310.0

[skew_correction mi_skew]
xy_skew = -0.00679190845337054
xz_skew = 0.0
yz_skew = 0.0
=======================
temperature_probe btt_eddy: loaded temperature drift calibration. Min Temp: 33.83, Min Freq: 3156001.351363
y(x) = 60.398093x^2 - 5564.540372x + 3322659.134314
y(x) = 3.440192x^2 - 381.239579x + 3204466.582019
y(x) = 1.125202x^2 - 119.470102x + 3191594.449302
y(x) = -0.153070x^2 + 17.721542x + 3183159.664481
y(x) = -0.957123x^2 + 107.407930x + 3176791.037916
y(x) = -1.751515x^2 + 190.159212x + 3171474.720102
y(x) = -2.675074x^2 + 281.955770x + 3166582.715676
y(x) = -2.988620x^2 + 318.670366x + 3163316.106670
y(x) = -3.164299x^2 + 338.412885x + 3160957.710763
temperature_probe btt_eddy: registered drift compensation with probe [probe_eddy_current btt_eddy]
Extruder max_extrude_ratio=0.266081
mcu 'mcu': Starting serial connect
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
webhooks client 548423718544: New connection
webhooks client 548423718544: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
MCU error during connect
Traceback (most recent call last):
  File "/home/luis/klipper/klippy/mcu.py", line 772, in _attach
    self._serial.connect_uart(self._serialport, self._baud, rts)
  File "/home/luis/klipper/klippy/serialhdl.py", line 191, in connect_uart
    self._error("Unable to connect")
  File "/home/luis/klipper/klippy/serialhdl.py", line 68, in _error
    raise error(self.warn_prefix + (msg % params))
serialhdl.error: mcu 'mcu': Unable to connect

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/luis/klipper/klippy/klippy.py", line 131, in _connect
    self.send_event("klippy:mcu_identify")
  File "/home/luis/klipper/klippy/klippy.py", line 223, in send_event
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klipper/klippy/klippy.py", line 223, in <listcomp>
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
            ^^^^^^^^^^^
  File "/home/luis/klipper/klippy/mcu.py", line 782, in _mcu_identify
    self._attach()
  File "/home/luis/klipper/klippy/mcu.py", line 777, in _attach
    raise error(str(e))
mcu.error: mcu 'mcu': Unable to connect
mcu 'mcu': Unable to connect
Once the underlying issue is corrected, use the
"FIRMWARE_RESTART" command to reset the firmware, reload the
config, and restart the host software.
Error configuring printer

Build file /home/luis/klipper/klippy/../.config(2653): Thu Jan  8 15:50:35 2026
========= Last MCU build config =========
CONFIG_LOW_LEVEL_OPTIONS=y
# CONFIG_MACH_AVR is not set
# CONFIG_MACH_ATSAM is not set
# CONFIG_MACH_ATSAMD is not set
# CONFIG_MACH_LPC176X is not set
# CONFIG_MACH_STM32 is not set
# CONFIG_MACH_HC32F460 is not set
CONFIG_MACH_RPXXXX=y
# CONFIG_MACH_PRU is not set
# CONFIG_MACH_AR100 is not set
# CONFIG_MACH_LINUX is not set
# CONFIG_MACH_SIMU is not set
CONFIG_BOARD_DIRECTORY="rp2040"
CONFIG_MCU="rp2040"
CONFIG_CLOCK_FREQ=12000000
CONFIG_USBSERIAL=y
CONFIG_FLASH_SIZE=0x200000
CONFIG_FLASH_BOOT_ADDRESS=0x10000100
CONFIG_RAM_START=0x20000000
CONFIG_RAM_SIZE=0x42000
CONFIG_STACK_SIZE=512
CONFIG_FLASH_APPLICATION_ADDRESS=0x10000100
CONFIG_RPXXXX_SELECT=y
CONFIG_MACH_RP2040=y
# CONFIG_MACH_RP2350 is not set
CONFIG_RP2040_HAVE_STAGE2=y
CONFIG_RPXXXX_FLASH_START_0100=y
# CONFIG_RPXXXX_FLASH_START_4000 is not set
CONFIG_RP2040_FLASH_W25Q080=y
# CONFIG_RP2040_FLASH_GENERIC_03 is not set
CONFIG_RP2040_STAGE2_FILE="boot2_w25q080.S"
CONFIG_RP2040_STAGE2_CLKDIV=2
CONFIG_RPXXXX_USB=y
# CONFIG_RPXXXX_SERIAL_UART0_PINS_0_1 is not set
# CONFIG_RPXXXX_SERIAL_UART0_PINS_12_13 is not set
# CONFIG_RPXXXX_SERIAL_UART0_PINS_16_17 is not set
# CONFIG_RPXXXX_SERIAL_UART0_PINS_28_29 is not set
# CONFIG_RPXXXX_SERIAL_UART1_PINS_4_5 is not set
# CONFIG_RPXXXX_SERIAL_UART1_PINS_8_9 is not set
# CONFIG_RPXXXX_SERIAL_UART1_PINS_20_21 is not set
# CONFIG_RPXXXX_SERIAL_UART1_PINS_24_25 is not set
# CONFIG_RPXXXX_CANBUS is not set
# CONFIG_RPXXXX_USBCANBUS is not set
CONFIG_RPXXXX_CANBUS_GPIO_RX=4
CONFIG_RPXXXX_CANBUS_GPIO_TX=5
CONFIG_USB=y
CONFIG_USB_VENDOR_ID=0x1d50
CONFIG_USB_DEVICE_ID=0x614e
CONFIG_USB_SERIAL_NUMBER_CHIPID=y
CONFIG_USB_SERIAL_NUMBER="12345"

#
# USB ids
#
# end of USB ids

CONFIG_WANT_ADC=y
CONFIG_WANT_SPI=y
CONFIG_WANT_SOFTWARE_SPI=y
CONFIG_WANT_I2C=y
CONFIG_WANT_SOFTWARE_I2C=y
CONFIG_WANT_HARD_PWM=y
CONFIG_WANT_BUTTONS=y
CONFIG_WANT_TMCUART=y
CONFIG_WANT_NEOPIXEL=y
CONFIG_WANT_PULSE_COUNTER=y
CONFIG_WANT_ST7920=y
CONFIG_WANT_HD44780=y
CONFIG_WANT_ADXL345=y
CONFIG_WANT_LIS2DW=y
CONFIG_WANT_MPU9250=y
CONFIG_WANT_ICM20948=y
CONFIG_WANT_THERMOCOUPLE=y
CONFIG_WANT_HX71X=y
CONFIG_WANT_ADS1220=y
CONFIG_WANT_LDC1612=y
CONFIG_WANT_SENSOR_ANGLE=y
CONFIG_NEED_SENSOR_BULK=y
CONFIG_WANT_LOAD_CELL_PROBE=y
CONFIG_NEED_SOS_FILTER=y
CONFIG_CANBUS_FREQUENCY=1000000
CONFIG_INLINE_STEPPER_HACK=y
CONFIG_HAVE_STEPPER_OPTIMIZED_BOTH_EDGE=y
CONFIG_WANT_STEPPER_OPTIMIZED_BOTH_EDGE=y
CONFIG_INITIAL_PINS=""
CONFIG_HAVE_GPIO=y
CONFIG_HAVE_GPIO_ADC=y
CONFIG_HAVE_GPIO_SPI=y
CONFIG_HAVE_GPIO_I2C=y
CONFIG_HAVE_GPIO_HARD_PWM=y
CONFIG_HAVE_STRICT_TIMING=y
CONFIG_HAVE_CHIPID=y
CONFIG_HAVE_BOOTLOADER_REQUEST=y
CONFIG_HAVE_SOFTWARE_DIVIDE_REQUIRED=y
=======================
Build file /home/luis/klipper/klippy/../out/klipper.dict(10849): Thu Jan  8 03:28:48 2026
Last MCU build version: v0.13.0-320-gc80324946
Last MCU build tools: gcc: (15:12.2.rel1-1) 12.2.1 20221205 binutils: (2.40-2+18+b1) 2.40
Last MCU build config: ADC_MAX=4095 BUS_PINS_i2c0a=gpio0,gpio1 BUS_PINS_i2c0b=gpio4,gpio5 BUS_PINS_i2c0c=gpio8,gpio9 BUS_PINS_i2c0d=gpio12,gpio13 BUS_PINS_i2c0e=gpio16,gpio17 BUS_PINS_i2c0f=gpio20,gpio21 BUS_PINS_i2c0g=gpio24,gpio25 BUS_PINS_i2c0h=gpio28,gpio29 BUS_PINS_i2c1a=gpio2,gpio3 BUS_PINS_i2c1b=gpio6,gpio7 BUS_PINS_i2c1c=gpio10,gpio11 BUS_PINS_i2c1d=gpio14,gpio15 BUS_PINS_i2c1e=gpio18,gpio19 BUS_PINS_i2c1f=gpio22,gpio23 BUS_PINS_i2c1g=gpio26,gpio27 BUS_PINS_spi0_gpio0_gpio3_gpio2=gpio0,gpio3,gpio2 BUS_PINS_spi0_gpio16_gpio19_gpio18=gpio16,gpio19,gpio18 BUS_PINS_spi0_gpio20_gpio23_gpio22=gpio20,gpio23,gpio22 BUS_PINS_spi0_gpio4_gpio3_gpio2=gpio4,gpio3,gpio2 BUS_PINS_spi0_gpio4_gpio7_gpio6=gpio4,gpio7,gpio6 BUS_PINS_spi0a=gpio0,gpio3,gpio2 BUS_PINS_spi0b=gpio4,gpio7,gpio6 BUS_PINS_spi0c=gpio16,gpio19,gpio18 BUS_PINS_spi0d=gpio20,gpio23,gpio22 BUS_PINS_spi1_gpio12_gpio11_gpio10=gpio12,gpio11,gpio10 BUS_PINS_spi1_gpio12_gpio15_gpio14=gpio12,gpio15,gpio14 BUS_PINS_spi1_gpio24_gpio27_gpio26=gpio24,gpio27,gpio26 BUS_PINS_spi1_gpio8_gpio11_gpio10=gpio8,gpio11,gpio10 BUS_PINS_spi1a=gpio8,gpio11,gpio10 BUS_PINS_spi1b=gpio12,gpio15,gpio14 BUS_PINS_spi1c=gpio24,gpio27,gpio26 CLOCK_FREQ=12000000 MCU=rp2040 PWM_MAX=255 STATS_SUMSQ_BASE=256 STEPPER_STEP_BOTH_EDGE=1
Build file /home/luis/klipper/klippy/../out/klipper.elf(1738412): Thu Jan  8 03:28:59 2026
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      Starting Klippy...
Args: ['/home/luis/klipper/klippy/klippy.py', '/home/luis/printer_data/config/printer.cfg', '-l', '/home/luis/printer_data/logs/klippy.log', '-I', '/home/luis/printer_data/comms/klippy.serial', '-a', '/home/luis/printer_data/comms/klippy.sock']
Git version: 'v0.13.0-320-gc80324946'
Branch: master
Remote: origin
Tracked URL: https://github.com/Klipper3d/klipper.git
CPU: 4 core ?
Device: Raspberry Pi 3 Model B Plus Rev 1.3
Linux: Linux version 6.12.47+rpt-rpi-v8 (serge@raspberrypi.com) (aarch64-linux-gnu-gcc-12 (Debian 12.2.0-14+deb12u1) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT Debian 1:6.12.47-1+rpt1~bookworm (2025-09-16)
Python: '3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]'
Start printer at Thu Jan  8 15:57:33 2026 (1767887853.7 35.3)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if last_extruder_temp.restore %}
	
	RESPOND TYPE=echo MSG='{"Restoring \\"%s\\" temperature to %3.1f\\u00B0C, this may take some time" % (printer.toolhead.extruder, last_extruder_temp.temp) }'
	M109 S{last_extruder_temp.temp}
	{% set do_resume = True %}
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	{% if runout_resume %}
	{% if do_resume %}
	{% if restore_idle_timeout > 0 %} SET_IDLE_TIMEOUT TIMEOUT={restore_idle_timeout} {% endif %}
	{client.user_resume_macro|default("")}
	_CLIENT_EXTRUDE
	RESUME_BASE VELOCITY={params.VELOCITY|default(sp_move)}
	{% endif %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]}'
	{% set _d = prompt_txt.append("\\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]) %}
	{% endif %}
	
	{% if not (runout_resume and do_resume) %}
	RESPOND TYPE=command MSG="action:prompt_begin RESUME aborted !!!"
	{% for element in prompt_txt %}
	RESPOND TYPE=command MSG='{"action:prompt_text %s" % element}'
	{% endfor %}
	RESPOND TYPE=command MSG="action:prompt_footer_button Ok|RESPOND TYPE=command MSG=action:prompt_end|info"
	RESPOND TYPE=command MSG="action:prompt_show"
	{% endif %}

[gcode_macro SET_PAUSE_NEXT_LAYER]
description = Enable a pause if the next layer is reached
gcode = 
	{% set pause_next_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_next_layer %}
	{% set ENABLE = params.ENABLE|default(1)|int != 0 %}
	{% set MACRO = params.MACRO|default(pause_next_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_next_layer VALUE="{{ 'enable': ENABLE, 'call': MACRO }}"

[gcode_macro SET_PAUSE_AT_LAYER]
description = Enable/disable a pause if a given layer number is reached
gcode = 
	{% set pause_at_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_at_layer %}
	{% set ENABLE = params.ENABLE|int != 0 if params.ENABLE is defined
	else params.LAYER is defined %}
	{% set LAYER = params.LAYER|default(pause_at_layer.layer)|int %}
	{% set MACRO = params.MACRO|default(pause_at_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_at_layer VALUE="{{ 'enable': ENABLE, 'layer': LAYER, 'call': MACRO }}"

[gcode_macro SET_PRINT_STATS_INFO]
rename_existing = SET_PRINT_STATS_INFO_BASE
description = Overwrite, to get pause_next_layer and pause_at_layer feature
variable_pause_next_layer = { 'enable': False, 'call': "PAUSE" }
variable_pause_at_layer = { 'enable': False, 'layer': 0, 'call': "PAUSE" }
gcode = 
	{% if pause_next_layer.enable %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_next_layer" % pause_next_layer.call}'
	{pause_next_layer.call}
	SET_PAUSE_NEXT_LAYER ENABLE=0
	{% elif pause_at_layer.enable and params.CURRENT_LAYER is defined and params.CURRENT_LAYER|int == pause_at_layer.layer %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_at_layer [%d]" % (pause_at_layer.call, pause_at_layer.layer)}'
	{pause_at_layer.call}
	SET_PAUSE_AT_LAYER ENABLE=0
	{% endif %}
	SET_PRINT_STATS_INFO_BASE {rawparams}

[gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL]
description = Helper: park toolhead used in PAUSE and CANCEL_PRINT
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set use_custom     = client.use_custom_pos|default(false)|lower == 'true' %}
	{% set custom_park_x  = client.custom_park_x|default(0.0) %}
	{% set custom_park_y  = client.custom_park_y|default(0.0) %}
	{% set park_dz        = client.custom_park_dz|default(2.0)|abs %}
	{% set sp_hop         = client.speed_hop|default(15) * 60 %}
	{% set sp_move        = client.speed_move|default(velocity) * 60 %}
	
	{% set origin    = printer.gcode_move.homing_origin %}
	{% set act       = printer.gcode_move.gcode_position %}
	{% set max       = printer.toolhead.axis_maximum %}
	{% set cone      = printer.toolhead.cone_start_z|default(max.z) %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	
	{% set z_min = params.Z_MIN|default(0)|float %}
	{% set z_park = [[(act.z + park_dz), z_min]|max, (max.z - origin.z)]|min %}
	{% set x_park = params.X       if params.X is defined
	else custom_park_x  if use_custom
	else 0.0            if round_bed
	else (max.x - 5.0) %}
	{% set y_park = params.Y       if params.Y is defined
	else custom_park_y  if use_custom
	else (max.y - 5.0)  if round_bed and z_park < cone
	else 0.0            if round_bed
	else (max.y - 5.0) %}
	
	_CLIENT_RETRACT
	{% if "xyz" in printer.toolhead.homed_axes %}
	G90
	G1 Z{z_park} F{sp_hop}
	G1 X{x_park} Y{y_park} F{sp_move}
	{% if not printer.gcode_move.absolute_coordinates %} G91 {% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='Printer not homed'
	{% endif %}

[gcode_macro _CLIENT_EXTRUDE]
description = Extrudes, if the extruder is hot enough
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set use_fw_retract = (client.use_fw_retract|default(false)|lower == 'true') and (printer.firmware_retraction is defined) %}
	{% set length = params.LENGTH|default(client.unretract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_unretract)|default(35) %}
	{% set absolute_extrude = printer.gcode_move.absolute_extrude %}
	
	{% if printer.toolhead.extruder != '' %}
	{% if printer[printer.toolhead.extruder].can_extrude %}
	{% if use_fw_retract %}
	{% if length < 0 %}
	G10
	{% else %}
	G11
	{% endif %}
	{% else %}
	M83
	G1 E{length} F{(speed|float|abs) * 60}
	{% if absolute_extrude %}
	M82
	{% endif %}
	{% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='{"\\"%s\\" not hot enough" % printer.toolhead.extruder}'
	{% endif %}
	{% endif %}

[gcode_macro _CLIENT_RETRACT]
description = Retracts, if the extruder is hot enough
gcode = 
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set length = params.LENGTH|default(client.retract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_retract)|default(35) %}
	
	_CLIENT_EXTRUDE LENGTH=-{length|float|abs} SPEED={speed|float|abs}

[gcode_macro _CLIENT_LINEAR_MOVE]
description = Linear move with save and restore of the gcode state
gcode = 
	{% set x_move = "X" ~ params.X if params.X is defined else "" %}
	{% set y_move = "Y" ~ params.Y if params.Y is defined else "" %}
	{% set z_move = "Z" ~ params.Z if params.Z is defined else "" %}
	{% set e_move = "E" ~ params.E if params.E is defined else "" %}
	{% set rate = "F" ~ params.F if params.F is defined else "" %}
	{% set ABSOLUTE = params.ABSOLUTE | default(0) | int != 0 %}
	{% set ABSOLUTE_E = params.ABSOLUTE_E | default(0) | int != 0 %}
	SAVE_GCODE_STATE NAME=_client_movement
	{% if x_move or y_move or z_move %}
	G9{ 0 if ABSOLUTE else 1 }
	{% endif %}
	{% if e_move %}
	M8{ 2 if ABSOLUTE_E else 3 }
	{% endif %}
	G1 { x_move } { y_move } { z_move } { e_move } { rate }
	RESTORE_GCODE_STATE NAME=_client_movement

[gcode_macro GET_TIMELAPSE_SETUP]
description = Print the Timelapse setup
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set output_txt = ["Timelapse Setup:"] %}
	{% set _dummy = output_txt.append("enable: %s" % tl.enable) %}
	{% set _dummy = output_txt.append("park: %s" % tl.park.enable) %}
	{% if tl.park.enable %}
	{% set _dummy = output_txt.append("park position: %s time: %s s" % (tl.park.pos, tl.park.time)) %}
	{% set _dummy = output_txt.append("park cord x:%s y:%s dz:%s" % (tl.park.coord.x, tl.park.coord.y, tl.park.coord.dz)) %}
	{% set _dummy = output_txt.append("travel speed: %s mm/s" % tl.speed.travel) %}
	{% endif %}
	{% set _dummy = output_txt.append("fw_retract: %s" % tl.extruder.fw_retract) %}
	{% if not tl.extruder.fw_retract %}
	{% set _dummy = output_txt.append("retract: %s mm speed: %s mm/s" % (tl.extruder.retract, tl.speed.retract)) %}
	{% set _dummy = output_txt.append("extrude: %s mm speed: %s mm/s" % (tl.extruder.extrude, tl.speed.extrude)) %}
	{% endif %}
	{% set _dummy = output_txt.append("verbose: %s" % tl.verbose) %}
	{action_respond_info(output_txt|join("\\n"))}

[gcode_macro _SET_TIMELAPSE_SETUP]
description = Set user parameters for timelapse
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	{% set park = {'min'   : {'x': (min.x / 1.42)|round(3) if round_bed else min.x|round(3),
	'y': (min.y / 1.42)|round(3) if round_bed else min.y|round(3)},
	'max'   : {'x': (max.x / 1.42)|round(3) if round_bed else max.x|round(3),
	'y': (max.y / 1.42)|round(3) if round_bed else max.y|round(3)},
	'center': {'x': (max.x-(max.x-min.x)/2)|round(3),
	'y': (max.y-(max.y-min.y)/2)|round(3)}} %}
	
	{% if params.ENABLE %}
	{% if params.ENABLE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=enable VALUE={True if params.ENABLE|lower == 'true' else False}
	{% else %}
	{action_raise_error("ENABLE=%s not supported. Allowed values are [True, False]" % params.ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.VERBOSE %}
	{% if params.VERBOSE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=verbose VALUE={True if params.VERBOSE|lower == 'true' else False}
	{% else %}
	{action_raise_error("VERBOSE=%s not supported. Allowed values are [True, False]" % params.VERBOSE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_X %}
	{% if params.CUSTOM_POS_X|float >= min.x and params.CUSTOM_POS_X|float <= max.x %}
	{% set _dummy = tl.park.custom.update({'x':params.CUSTOM_POS_X|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_X=%s must be within [%s - %s]" % (params.CUSTOM_POS_X, min.x, max.x))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_Y %}
	{% if params.CUSTOM_POS_Y|float >= min.y and params.CUSTOM_POS_Y|float <= max.y %}
	{% set _dummy = tl.park.custom.update({'y':params.CUSTOM_POS_Y|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_Y=%s must be within [%s - %s]" % (params.CUSTOM_POS_Y, min.y, max.y))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_DZ %}
	{% if params.CUSTOM_POS_DZ|float >= min.z and params.CUSTOM_POS_DZ|float <= max.z %}
	{% set _dummy = tl.park.custom.update({'dz':params.CUSTOM_POS_DZ|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_DZ=%s must be within [%s - %s]" % (params.CUSTOM_POS_DZ, min.z, max.z))}
	{% endif %}
	{% endif %}
	{% if params.PARK_ENABLE %}
	{% if params.PARK_ENABLE|lower is in ['true', 'false'] %}
	{% set _dummy = tl.park.update({'enable':True if params.PARK_ENABLE|lower == 'true' else False}) %}
	{% else %}
	{action_raise_error("PARK_ENABLE=%s not supported. Allowed values are [True, False]" % params.PARK_ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.PARK_POS %}
	{% if params.PARK_POS|lower is in ['center','front_left','front_right','back_left','back_right','custom','x_only','y_only'] %}
	{% set dic = {'center'      : {'x': park.center.x   , 'y': park.center.y   , 'dz': 1                },
	'front_left'  : {'x': park.min.x      , 'y': park.min.y      , 'dz': 0                },
	'front_right' : {'x': park.max.x      , 'y': park.min.y      , 'dz': 0                },
	'back_left'   : {'x': park.min.x      , 'y': park.max.y      , 'dz': 0                },
	'back_right'  : {'x': park.max.x      , 'y': park.max.y      , 'dz': 0                },
	'custom'      : {'x': tl.park.custom.x, 'y': tl.park.custom.y, 'dz': tl.park.custom.dz},
	'x_only'      : {'x': tl.park.custom.x, 'y': 'none'          , 'dz': tl.park.custom.dz},
	'y_only'      : {'x': 'none'          , 'y': tl.park.custom.y, 'dz': tl.park.custom.dz}} %}
	{% set _dummy = tl.park.update({'pos':params.PARK_POS|lower}) %}
	{% set _dummy = tl.park.update({'coord':dic[tl.park.pos]}) %}
	{% else %}
	{action_raise_error("PARK_POS=%s not supported. Allowed values are [CENTER, FRONT_LEFT, FRONT_RIGHT, BACK_LEFT, BACK_RIGHT, CUSTOM, X_ONLY, Y_ONLY]"
	% params.PARK_POS|upper)}
	{% endif %}
	{% endif %}
	{% if params.PARK_TIME %}
	{% if params.PARK_TIME|float >= 0.0 %}
	{% set _dummy = tl.park.update({'time':params.PARK_TIME|float|round(3)}) %}
	{% else %}
	{action_raise_error("PARK_TIME=%s must be a positive number" % params.PARK_TIME)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=park VALUE="{tl.park}"
	{% if params.TRAVEL_SPEED %}
	{% if params.TRAVEL_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'travel':params.TRAVEL_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("TRAVEL_SPEED=%s must be larger than 0" % params.TRAVEL_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_SPEED %}
	{% if params.RETRACT_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'retract':params.RETRACT_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_SPEED=%s must be larger than 0" % params.RETRACT_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.EXTRUDE_SPEED %}
	{% if params.EXTRUDE_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'extrude':params.EXTRUDE_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_SPEED=%s must be larger than 0" % params.EXTRUDE_SPEED)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=speed VALUE="{tl.speed}"
	{% if params.EXTRUDE_DISTANCE %}
	{% if params.EXTRUDE_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'extrude':params.EXTRUDE_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_DISTANCE=%s must be specified as positiv number" % params.EXTRUDE_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_DISTANCE %}
	{% if params.RETRACT_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'retract':params.RETRACT_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_DISTANCE=%s must be specified as positiv number" % params.RETRACT_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.FW_RETRACT %}
	{% if params.FW_RETRACT|lower is in ['true', 'false'] %}
	{% if 'firmware_retraction' in printer.configfile.settings %}
	{% set _dummy = tl.extruder.update({'fw_retract': True if params.FW_RETRACT|lower == 'true' else False}) %}
	{% else %}
	{% set _dummy = tl.extruder.update({'fw_retract':False}) %}
	{% if params.FW_RETRACT|capitalize == 'True' %}
	{action_raise_error("[firmware_retraction] not defined in printer.cfg. Can not enable fw_retract")}
	{% endif %}
	{% endif %}
	{% else %}
	{action_raise_error("FW_RETRACT=%s not supported. Allowed values are [True, False]" % params.FW_RETRACT|capitalize)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=extruder VALUE="{tl.extruder}"
	{% if printer.configfile.settings['gcode_macro pause'] is defined %}
	{% set _dummy = tl.macro.update({'pause': printer.configfile.settings['gcode_macro pause'].rename_existing}) %}
	{% endif %}
	{% if printer.configfile.settings['gcode_macro resume'] is defined %}
	{% set _dummy = tl.macro.update({'resume': printer.configfile.settings['gcode_macro resume'].rename_existing}) %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=macro VALUE="{tl.macro}"

[gcode_macro TIMELAPSE_TAKE_FRAME]
description = Take Timelapse shoot
variable_enable = False
variable_takingframe = False
variable_park = {'enable': False,
	'pos'   : 'center',
	'time'  : 0.1,
	'custom': {'x': 0, 'y': 0, 'dz': 0},
	'coord' : {'x': 0, 'y': 0, 'dz': 0}}
variable_extruder = {'fw_retract': False,
	'retract': 1.0,
	'extrude': 1.0}
variable_speed = {'travel': 100,
	'retract': 15,
	'extrude': 15}
variable_verbose = True
variable_check_time = 0.5
variable_restore = {'absolute': {'coordinates': True, 'extrude': True}, 'speed': 1500, 'e':0, 'factor': {'speed': 1.0, 'extrude': 1.0}}
variable_macro = {'pause': 'PAUSE', 'resume': 'RESUME'}
variable_is_paused = False
gcode = 
	{% set hyperlapse = True if params.HYPERLAPSE and params.HYPERLAPSE|lower =='true' else False %}
	{% if enable %}
	{% if (hyperlapse and printer['gcode_macro HYPERLAPSE'].run) or
	(not hyperlapse and not printer['gcode_macro HYPERLAPSE'].run) %}
	{% if park.enable %}
	{% set pos = {'x': 'X' + park.coord.x|string if park.pos != 'y_only' else '',
	'y': 'Y' + park.coord.y|string if park.pos != 'x_only' else '',
	'z': 'Z'+ [printer.gcode_move.gcode_position.z + park.coord.dz, printer.toolhead.axis_maximum.z]|min|string} %}
	{% set restore = {'absolute': {'coordinates': printer.gcode_move.absolute_coordinates,
	'extrude'    : printer.gcode_move.absolute_extrude},
	'speed'   : printer.gcode_move.speed,
	'e'       : printer.gcode_move.gcode_position.e,
	'factor'  : {'speed'  : printer.gcode_move.speed_factor,
	'extrude': printer.gcode_move.extrude_factor}} %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=restore VALUE="{restore}"
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, minimum extruder temperature not reached!")}{% endif %}
	{% else %}
	{% if extruder.fw_retract %}
	G10
	{% else %}
	M83
	G0 E-{extruder.retract} F{speed.retract * 60}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=True
	{macro.pause}
	SET_GCODE_OFFSET X=0 Y=0
	G90
	{% if "xyz" not in printer.toolhead.homed_axes %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, axis not homed yet!")}{% endif %}
	{% else %}
	G0 {pos.x} {pos.y} {pos.z} F{speed.travel * 60}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=takingframe VALUE=True
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={check_time}
	M400
	{% endif %}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE={hyperlapse}
	{% endif %}
	{% else %}
	{% if verbose %}{action_respond_info("Timelapse: disabled, take frame ignored")}{% endif %}
	{% endif %}

[gcode_macro _TIMELAPSE_NEW_FRAME]
description = action call for timelapse shoot. must be a seperate macro
gcode = 
	{action_call_remote_method("timelapse_newframe",
	macropark=printer['gcode_macro TIMELAPSE_TAKE_FRAME'].park,
	hyperlapse=params.HYPERLAPSE)}

[delayed_gcode _WAIT_TIMELAPSE_TAKE_FRAME]
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set factor = {'speed': printer.gcode_move.speed_factor, 'extrude': printer.gcode_move.extrude_factor} %}
	{% if tl.takingframe %}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={tl.check_time}
	{% else %}
	{tl.macro.resume} VELOCITY={tl.speed.travel}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=False
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{action_respond_info("Timelapse: Warning minimum extruder temperature not reached!")}
	{% else %}
	{% if tl.extruder.fw_retract %}
	G11
	{% else %}
	G0 E{tl.extruder.extrude} F{tl.speed.extrude * 60}
	G0 F{tl.restore.speed}
	{% if tl.restore.absolute.extrude %}
	M82
	G92 E{tl.restore.e}
	{% endif %}
	{% endif %}
	{% endif %}
	{% if tl.restore.factor.speed   != factor.speed   %} M220 S{(factor.speed*100)|round(0)}   {% endif %}
	{% if tl.restore.factor.extrude != factor.extrude %} M221 S{(factor.extrude*100)|round(0)} {% endif %}
	{% if not tl.restore.absolute.coordinates %} G91 {% endif %}
	{% endif %}

[gcode_macro HYPERLAPSE]
description = Start/Stop a hyperlapse recording
variable_cycle = 0
variable_run = False
gcode = 
	{% set cycle = params.CYCLE|default(30)|int %}
	{% if params.ACTION and params.ACTION|lower == 'start' %}
	{action_respond_info("Hyperlapse: frames started (Cycle %d sec)" % cycle)}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=True
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=cycle VALUE={cycle}
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True
	{% elif params.ACTION and params.ACTION|lower == 'stop' %}
	{% if run %}{action_respond_info("Hyperlapse: frames stopped")}{% endif %}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=False
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION=0
	{% else %}
	{action_raise_error("Hyperlapse: No valid input parameter
	Use:
	- HYPERLAPSE ACTION=START [CYCLE=time]
	- HYPERLAPSE ACTION=STOP")}
	{% endif %}

[delayed_gcode _HYPERLAPSE_LOOP]
gcode = 
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={printer["gcode_macro HYPERLAPSE"].cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True

[gcode_macro TIMELAPSE_RENDER]
description = Render Timelapse video and wait for the result
variable_render = False
variable_run_identifier = 0
gcode = 
	{action_respond_info("Timelapse: Rendering started")}
	{action_call_remote_method("timelapse_render", byrendermacro="True")}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=render VALUE=True
	{printer.configfile.settings['gcode_macro pause'].rename_existing}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5

[delayed_gcode _WAIT_TIMELAPSE_RENDER]
gcode = 
	{% set ri = printer['gcode_macro TIMELAPSE_RENDER'].run_identifier % 4 %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=run_identifier VALUE={ri + 1}
	{% if printer['gcode_macro TIMELAPSE_RENDER'].render %}
	M117 Rendering {['-','\\\\','|','/'][ri]}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5
	{% else %}
	{action_respond_info("Timelapse: Rendering finished")}
	M117
	{printer.configfile.settings['gcode_macro resume'].rename_existing}
	{% endif %}

[gcode_macro TEST_STREAM_DELAY]
description = Helper macro to find stream and park delay
gcode = 
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set act = printer.toolhead.position %}
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% if act.z > 5.0 %}
	G0 X{min.x + 5.0} F{tl.speed.travel|int * 60}
	G0 X{(max.x-min.x)/2}
	G4 P{tl.park.time|float * 1000}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE=FALSE
	G0 X{max.x - 5.0}
	{% else %}
	{action_raise_error("Toolhead z %.3f to low. Please place head above z = 5.0" % act.z)}
	{% endif %}

[gcode_macro PIDcalibrate]
gcode = 
	PID_CALIBRATE HEATER=extruder TARGET=235
	PID_CALIBRATE HEATER=heater_bed TARGET=80

[gcode_macro POWER_OFF_PRINTER]
gcode = 
	{action_call_remote_method( "set_device_power", device="printer_plug", state="off")}

[gcode_macro START_PRINT]
gcode = 
	{% set BED_TEMP = params.BED_TEMP|default(60)|float %}
	
	{% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(190)|float %}
	
	M140 S{BED_TEMP}
	
	G90
	
	G28
	
	G1 Z5 F3000
	BED_MESH_PROFILE LOAD=default
	
	M190 S{BED_TEMP}
	
	M109 S{EXTRUDER_TEMP}
	M117 Purge extruder
	G1 X25 Y20 Z0.3 F5000.0
	G1 X25 Y175.0 Z0.3 F1500.0 E15
	G1 X25 Y175.0 Z0.4 F5000.0
	G1 X25 Y20 Z0.4 F1500.0 E30
	G92 E0
	G1 Z1.0 F3000

[gcode_macro END_PRINT]
gcode = 
	
	M140 S0
	M104 S0
	
	M106 S0
	
	G91
	G1 X-2 Y-2 E-3 F300
	
	G1 Z10 F3000
	G90
	
	M84
	BED_MESH_CLEAR

[gcode_macro CALCULATE_BED_MESH]
description = Calculate bed_mesh boundaries automatically based on your bltouch/probe config
gcode = 
	{% set BED_MESH_MARGIN = params.BED_MESH_MARGIN|default(10)|float %}
	
	{% set X_MAX = printer.toolhead.axis_maximum.x|default(230)|float %}
	{% set Y_MAX = printer.toolhead.axis_maximum.y|default(230)|float %}
	
	{% set X_OFFSET = 0.0 |float %}
	{% set Y_OFFSET = 0.0 |float %}
	
	{% if printer.configfile.config["bltouch"] is defined %}
	{% set X_OFFSET = (printer.configfile.settings.bltouch.x_offset if printer.configfile.settings.bltouch.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.settings.bltouch.y_offset if printer.configfile.settings.bltouch.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	{% if printer.configfile.config["probe"] is defined %}
	{% set X_OFFSET = (printer.configfile.config.probe.x_offset if printer.configfile.config.probe.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.config.probe.y_offset if printer.configfile.config.probe.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	
	
	
	{% set BED_MESH_MIN_X = BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MIN_Y = BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_X = X_MAX - (X_OFFSET)|abs - BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_MAX - BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_Y = Y_MAX - (Y_OFFSET)|abs - BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_MAX - BED_MESH_MARGIN |float %}
	
	
	{action_respond_info("BED_MESH_MARGIN : %f" % (BED_MESH_MARGIN))}
	{action_respond_info("X_MAX           : %f" % (X_MAX))}
	{action_respond_info("Y_MAX           : %f" % (Y_MAX))}
	{action_respond_info("X_OFFSET        : %f" % (X_OFFSET))}
	{action_respond_info("Y_OFFSET        : %f" % (Y_OFFSET))}
	{action_respond_info("BED_MESH_MIN_X  : %f" % (BED_MESH_MIN_X))}
	{action_respond_info("BED_MESH_MIN_Y  : %f" % (BED_MESH_MIN_Y))}
	{action_respond_info("BED_MESH_MAX_X  : %f" % (BED_MESH_MAX_X))}
	{action_respond_info("BED_MESH_MAX_Y  : %f" % (BED_MESH_MAX_Y))}
	{action_respond_info("--- VALUES TO ADD OR UPDATE TO OUR BED_MESH VALUES ---")}
	{action_respond_info("--- VALORES PARA AGREGAR O ACTUALIZAR EN NUESTRA SECCIÓN BED_MESH ---")}
	{action_respond_info("mesh_max: %s,%s" % (BED_MESH_MAX_X,BED_MESH_MAX_Y))}
	{action_respond_info("mesh_min: %s,%s" % (BED_MESH_MIN_X,BED_MESH_MIN_Y))}

[gcode_macro PID_EXTRUDER]
description = PID Tune for the Extruder
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set T = params.TEMPERATURE|default(210)|float %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set P = printer.configfile.config[e].pid_kp|float %}
	{% set I = printer.configfile.config[e].pid_ki|float %}
	{% set D = printer.configfile.config[e].pid_kd|float %}
	M118 Homing...
	G28
	M106 S{S}
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Extruder PID calibration...
	PID_CALIBRATE HEATER={e} TARGET={T}
	TURN_OFF_HEATERS
	M107
	SAVE_CONFIG

[gcode_macro PID_BED]
description = PID Tune for the Bed
gcode = 
	{% set T = params.TEMPERATURE|default(60)|float %}
	{% set P = printer.configfile.config['heater_bed'].pid_kp|float %}
	{% set I = printer.configfile.config['heater_bed'].pid_ki|float %}
	{% set D = printer.configfile.config['heater_bed'].pid_kd|float %}
	M118 Homing...
	G28
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={T}
	TURN_OFF_HEATERS
	SAVE_CONFIG

[gcode_macro PID_ALL]
description = Heater and Bed temperature calibration. Usage: PID_ALL [TE=temperature] [TB=temperature]\\n Calibra la temperatura del extrusor y la cama. Uso: PID_ALL [TE=temperatura] [TB=temperature]
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set TE = params.TE|default(195)|int %}
	{% set TB = params.TB|default(45)|int %}
	M118 Homing...
	G28
	M118 Extruder PID calibration...
	M106 S{S}
	PID_CALIBRATE HEATER={e} TARGET={TE}
	M107
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={TB}
	SAVE_CONFIG

[tmc2209 stepper_x]
uart_pin = PE6
run_current = 0.9
diag_pin = ^PA15
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_y]
uart_pin = PE3
run_current = 0.9
diag_pin = ^PD2
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_z]
uart_pin = PB7
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 stepper_z1]
uart_pin = PD4
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 extruder]
uart_pin = PB3
run_current = 0.842
diag_pin = 
stealthchop_threshold = 0

[mcu eddy]
serial = /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00
restart_method = command

[temperature_sensor btt_eddy_mcu]
sensor_type = temperature_mcu
sensor_mcu = eddy
min_temp = 10
max_temp = 100

[probe_eddy_current btt_eddy]
sensor_type = ldc1612
z_offset = 2.5
i2c_mcu = eddy
i2c_bus = i2c0f
x_offset = -30
y_offset = 5
reg_drive_current = 16
calibrate = 
	0.050188:3205933.097,0.090337:3205145.727,0.130487:3204354.163,
	0.169383:3203615.123,0.209533:3202860.267,0.249683:3202120.825,
	0.289833:3201389.932,0.329983:3200675.781,0.370133:3199937.342,
	0.410283:3199271.075,0.450433:3198562.823,0.490583:3197906.664,
	0.529478:3197264.891,0.569628:3196643.334,0.609778:3195982.110,
	0.649928:3195394.352,0.690078:3194737.336,0.730228:3194161.411,
	0.770378:3193564.178,0.810528:3192980.830,0.849423:3192409.769,
	0.889573:3191874.493,0.929723:3191327.866,0.969873:3190787.673,
	1.010023:3190232.313,1.050173:3189727.474,1.090323:3189210.067,
	1.130473:3188739.481,1.170623:3188237.257,1.209519:3187753.422,
	1.249669:3187291.436,1.289819:3186821.547,1.329969:3186360.473,
	1.370119:3185924.800,1.410269:3185491.381,1.450419:3185053.330,
	1.490569:3184594.190,1.529464:3184205.277,1.569614:3183785.498,
	1.609764:3183350.340,1.649914:3182966.762,1.690064:3182588.711,
	1.730214:3182190.755,1.770364:3181813.670,1.810514:3181420.036,
	1.849409:3181087.634,1.889559:3180703.858,1.929709:3180363.438,
	1.969859:3180003.082,2.010009:3179664.903,2.050159:3179332.781,
	2.090309:3178990.508,2.130459:3178673.256,2.170609:3178345.224,
	2.209505:3178050.416,2.249655:3177734.057,2.289805:3177419.463,
	2.329955:3177136.203,2.370105:3176837.527,2.410255:3176546.139,
	2.450405:3176268.706,2.490555:3175972.146,2.529450:3175723.811,
	2.569600:3175470.080,2.609750:3175223.081,2.649900:3174962.842,
	2.690050:3174704.198,2.730200:3174460.913,2.770350:3174228.920,
	2.810500:3173989.118,2.849395:3173761.350,2.889545:3173516.616,
	2.929695:3173309.604,2.969845:3173089.770,3.009995:3172877.982,
	3.050145:3172644.639,3.090295:3172452.377,3.130445:3172252.422,
	3.170595:3172031.650,3.209491:3171857.260,3.249641:3171650.997,
	3.289791:3171441.897,3.329941:3171248.522,3.370091:3171071.032,
	3.410241:3170902.167,3.450391:3170700.892,3.490541:3170509.888,
	3.529436:3170367.070,3.569586:3170188.460,3.609736:3170015.379,
	3.649886:3169825.355,3.690036:3169687.899,3.730186:3169514.422,
	3.770336:3169378.249,3.810486:3169199.096,3.849381:3169055.600,
	3.889531:3168906.908,3.929681:3168770.855,3.969831:3168587.431,
	4.009981:3168461.835,4.050131:3168313.942

[temperature_probe btt_eddy]
sensor_type = Generic 3950
sensor_pin = eddy:gpio26
horizontal_move_z = 2
calibration_temp = 29.941653
drift_calibration = 
	3322659.134314, -5564.540372, 60.398093
	3204466.582019, -381.239579, 3.440192
	3191594.449302, -119.470102, 1.125202
	3183159.664481, 17.721542, -0.153070
	3176791.037916, 107.407930, -0.957123
	3171474.720102, 190.159212, -1.751515
	3166582.715676, 281.955770, -2.675074
	3163316.106670, 318.670366, -2.988620
	3160957.710763, 338.412885, -3.164299
drift_calibration_min_temp = 33.83103284492943

[bed_mesh]
speed = 50
horizontal_move_z = 1
mesh_min = 50,60
mesh_max = 280, 310
probe_count = 9, 9
mesh_pps = 3, 3
algorithm = bicubic
bicubic_tension = 0.2

[safe_z_home]
home_xy_position = 204, 185
speed = 50
z_hop = 10
z_hop_speed = 10

[save_variables]
filename = ~/printer_data/config/variables.cfg

[force_move]
enable_force_move = True

[delayed_gcode RESTORE_PROBE_OFFSET]
initial_duration = 1.
gcode = 
	{% set svv = printer.save_variables.variables %}
	{% if not printer["gcode_macro SET_GCODE_OFFSET"].restored %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ svv.nvm_offset|default(0) }
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=restored VALUE=True
	{% endif %}

[gcode_macro G28]
rename_existing = G28.1
gcode = 
	
	G28.1 {rawparams}
	{% if not rawparams or (rawparams and 'Z' in rawparams) %}
	PROBE
	SET_Z_FROM_PROBE
	{% endif %}

[gcode_macro SET_Z_FROM_PROBE]
gcode = 
	{% set cf = printer.configfile.settings %}
	SET_GCODE_OFFSET_ORIG Z={printer.probe.last_z_result - cf['probe_eddy_current btt_eddy'].z_offset + printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset}
	G90
	G1 Z{cf.safe_z_home.z_hop}

[gcode_macro Z_OFFSET_APPLY_PROBE]
rename_existing = Z_OFFSET_APPLY_PROBE_ORIG
gcode = 
	SAVE_VARIABLE VARIABLE=nvm_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset }

[gcode_macro SET_GCODE_OFFSET]
rename_existing = SET_GCODE_OFFSET_ORIG
variable_restored = False
variable_runtime_offset = 0
gcode = 
	{% if params.Z_ADJUST %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset + params.Z_ADJUST|float }
	{% endif %}
	{% if params.Z %}
	{% set paramList = rawparams.split() %}
	{% for i in range(paramList|length) %}
	{% if paramList[i]=="Z=0" %}
	{% set temp=paramList.pop(i) %}
	{% set temp="Z_ADJUST=" + (-printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset)|string %}
	{% if paramList.append(temp) %}{% endif %}
	{% endif %}
	{% endfor %}
	{% set rawparams=paramList|join(' ') %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE=0
	{% endif %}
	SET_GCODE_OFFSET_ORIG { rawparams }

[gcode_macro PROBE_EDDY_CURRENT_CALIBRATE_AUTO]
gcode = 
	BED_MESH_CLEAR
	G28 X Y
	G90
	G1 X{ printer.toolhead.axis_maximum.x/2 } Y{ printer.toolhead.axis_maximum.y/2 } F6000
	{% if 'z' not in printer.toolhead.homed_axes %}
	SET_KINEMATIC_POSITION Z={ printer.toolhead.axis_maximum.z-1 }
	{% endif %}
	PROBE_EDDY_CURRENT_CALIBRATE {rawparams}

[mcu]
serial = /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00

[stepper_x]
step_pin = PC14
dir_pin = !PC13
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA14
position_endstop = 0
position_min = 0
position_max = 330
homing_speed = 50

[stepper_y]
step_pin = PE5
dir_pin = PE4
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA15
position_endstop = 0
position_min = 0
position_max = 320
homing_speed = 50

[stepper_z1]
step_pin = PE1
dir_pin = PE0
enable_pin = !PE2
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop

[stepper_z]
step_pin = PD6
dir_pin = PD5
enable_pin = !PD7
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop
position_max = 400
position_min = -5
homing_speed = 10

[screws_tilt_adjust]
screw1 = 204,185
screw1_name = Central screw
screw2 = 105,84
screw2_name = Front left screw
screw3 = 305,84
screw3_name = Rear left screw
screw4 = 305,284
screw4_name = Front right screw
screw5 = 105, 284
screw5_name = Rear right screw
horizontal_move_z = 10
speed = 100
screw_thread = CW-M3

[bed_screws]
screw1 = 50,70
screw2 = 250,70
screw3 = 250, 230
screw4 = 50, 230

[z_tilt]
z_positions = -60, 155
	330, 155
points = 70, 184
	300, 184
speed = 100
horizontal_move_z = 10
retries = 8
retry_tolerance = 0.005

[extruder]
step_pin = PB5
dir_pin = !PB4
enable_pin = !PB6
microsteps = 16
rotation_distance = 8.06
nozzle_diameter = 0.400
filament_diameter = 1.750
heater_pin = PB1
sensor_type = ATC Semitec 104GT-2
sensor_pin = PC1
max_extrude_only_distance = 100000
min_temp = 0
max_temp = 260
pressure_advance = 0.08
control = pid
pid_kp = 39.588
pid_ki = 7.762
pid_kd = 50.475

[heater_bed]
heater_pin = PB10
sensor_type = ATC Semitec 104NT-4-R025H42G
sensor_pin = PC0
min_temp = 0
max_temp = 130
control = pid
pid_kp = 57.129
pid_ki = 2.026
pid_kd = 402.756
x_count = 4
y_count = 4
mesh_x_pps = 2
mesh_y_pps = 2
algo = bicubic
tension = 0.2
min_x = 40.0
max_x = 256.0
min_y = 60.0
max_y = 279.98999999999995

[fan]
pin = PA2
max_power = 1.0
off_below = 0.1

[heater_fan hotend]
pin = PA0
heater = extruder
heater_temp = 50.0
fan_speed = 1.0
shutdown_speed = 1.0

[printer]
kinematics = cartesian
max_velocity = 250
max_accel = 4500
max_z_velocity = 25
max_z_accel = 100

[skew_correction]

[bed_mesh default]
version = 1
points = 
	0.077380, 0.111423, 0.114676, 0.156457, 0.174093, 0.168682, 0.150091, 0.125241, 0.144394
	0.019770, 0.035236, 0.040041, 0.064163, 0.097841, 0.072235, 0.036121, 0.038328, -0.022320
	-0.046588, -0.004041, -0.002183, 0.034924, 0.056260, 0.057109, 0.025641, -0.003699, 0.000421
	-0.014058, -0.015146, -0.014967, 0.007296, 0.033845, 0.025323, -0.004179, -0.028621, -0.045631
	-0.053217, -0.062006, -0.048567, -0.019670, -0.003835, 0.000873, -0.021848, -0.046722, -0.038119
	-0.082454, -0.064824, -0.071665, -0.049962, -0.027577, -0.036043, -0.056768, -0.072205, -0.063067
	0.026282, -0.006652, -0.015925, 0.013883, 0.040249, 0.050473, 0.018200, -0.017486, -0.044483
	0.006865, 0.029730, 0.028595, 0.044249, 0.088176, 0.080421, 0.046590, 0.046284, 0.075516
	0.059874, -0.031578, -0.021740, 0.006004, 0.063576, 0.092164, 0.028281, -0.012436, -0.035619
x_count = 9
y_count = 9
mesh_x_pps = 3
mesh_y_pps = 3
algo = bicubic
tension = 0.2
min_x = 50.0
max_x = 280.0
min_y = 60.0
max_y = 310.0

[skew_correction mi_skew]
xy_skew = -0.00679190845337054
xz_skew = 0.0
yz_skew = 0.0
=======================
temperature_probe btt_eddy: loaded temperature drift calibration. Min Temp: 33.83, Min Freq: 3156001.351363
y(x) = 60.398093x^2 - 5564.540372x + 3322659.134314
y(x) = 3.440192x^2 - 381.239579x + 3204466.582019
y(x) = 1.125202x^2 - 119.470102x + 3191594.449302
y(x) = -0.153070x^2 + 17.721542x + 3183159.664481
y(x) = -0.957123x^2 + 107.407930x + 3176791.037916
y(x) = -1.751515x^2 + 190.159212x + 3171474.720102
y(x) = -2.675074x^2 + 281.955770x + 3166582.715676
y(x) = -2.988620x^2 + 318.670366x + 3163316.106670
y(x) = -3.164299x^2 + 338.412885x + 3160957.710763
temperature_probe btt_eddy: registered drift compensation with probe [probe_eddy_current btt_eddy]
Extruder max_extrude_ratio=0.266081
mcu 'mcu': Starting serial connect
Loaded MCU 'mcu' 144 commands (v0.13.0-320-gc80324946 / gcc: (15:12.2.rel1-1) 12.2.1 20221205 binutils: (2.40-2+18+b1) 2.40)
MCU 'mcu' config: ADC_MAX=4095 BUS_PINS_i2c1=PB6,PB7 BUS_PINS_i2c1a=PB8,PB9 BUS_PINS_i2c2=PB10,PB11 BUS_PINS_i2c2_PF1_PF0=PF1,PF0 BUS_PINS_i2c2a=PH4,PH5 BUS_PINS_i2c3=PA8,PC9 BUS_PINS_i2c3a=PH7,PH8 BUS_PINS_sdio=PC12,PD2,PC8,PC9,PC10,PC11 BUS_PINS_spi1=PA6,PA7,PA5 BUS_PINS_spi1_PA6_PA7_PA5=PA6,PA7,PA5 BUS_PINS_spi1_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi1a=PB4,PB5,PB3 BUS_PINS_spi2=PB14,PB15,PB13 BUS_PINS_spi2_PB14_PB15_PB13=PB14,PB15,PB13 BUS_PINS_spi2_PC2_PC3_PB10=PC2,PC3,PB10 BUS_PINS_spi2_PI2_PI3_PI1=PI2,PI3,PI1 BUS_PINS_spi2a=PC2,PC3,PB10 BUS_PINS_spi2b=PI2,PI3,PI1 BUS_PINS_spi3=PB4,PB5,PB3 BUS_PINS_spi3_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi3_PC11_PC12_PC10=PC11,PC12,PC10 BUS_PINS_spi3a=PC11,PC12,PC10 CLOCK_FREQ=168000000 MCU=stm32f407xx PWM_MAX=257 RESERVE_PINS_USB=PA11,PA12 RESERVE_PINS_crystal=PH0,PH1 STATS_SUMSQ_BASE=256 STEPPER_OPTIMIZED_EDGE=21 STEPPER_STEP_BOTH_EDGE=1
mcu 'eddy': Starting serial connect
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
webhooks client 547616954256: New connection
webhooks client 547616954256: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
Attempting MCU 'mcu' reset command
Unable to issue reset command on MCU 'eddy'
webhooks client 547616954256: Disconnected
Restarting printer
Start printer at Thu Jan  8 15:58:11 2026 (1767887891.1 72.6)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if last_extruder_temp.restore %}
	
	RESPOND TYPE=echo MSG='{"Restoring \\"%s\\" temperature to %3.1f\\u00B0C, this may take some time" % (printer.toolhead.extruder, last_extruder_temp.temp) }'
	M109 S{last_extruder_temp.temp}
	{% set do_resume = True %}
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	{% if runout_resume %}
	{% if do_resume %}
	{% if restore_idle_timeout > 0 %} SET_IDLE_TIMEOUT TIMEOUT={restore_idle_timeout} {% endif %}
	{client.user_resume_macro|default("")}
	_CLIENT_EXTRUDE
	RESUME_BASE VELOCITY={params.VELOCITY|default(sp_move)}
	{% endif %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]}'
	{% set _d = prompt_txt.append("\\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]) %}
	{% endif %}
	
	{% if not (runout_resume and do_resume) %}
	RESPOND TYPE=command MSG="action:prompt_begin RESUME aborted !!!"
	{% for element in prompt_txt %}
	RESPOND TYPE=command MSG='{"action:prompt_text %s" % element}'
	{% endfor %}
	RESPOND TYPE=command MSG="action:prompt_footer_button Ok|RESPOND TYPE=command MSG=action:prompt_end|info"
	RESPOND TYPE=command MSG="action:prompt_show"
	{% endif %}

[gcode_macro SET_PAUSE_NEXT_LAYER]
description = Enable a pause if the next layer is reached
gcode = 
	{% set pause_next_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_next_layer %}
	{% set ENABLE = params.ENABLE|default(1)|int != 0 %}
	{% set MACRO = params.MACRO|default(pause_next_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_next_layer VALUE="{{ 'enable': ENABLE, 'call': MACRO }}"

[gcode_macro SET_PAUSE_AT_LAYER]
description = Enable/disable a pause if a given layer number is reached
gcode = 
	{% set pause_at_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_at_layer %}
	{% set ENABLE = params.ENABLE|int != 0 if params.ENABLE is defined
	else params.LAYER is defined %}
	{% set LAYER = params.LAYER|default(pause_at_layer.layer)|int %}
	{% set MACRO = params.MACRO|default(pause_at_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_at_layer VALUE="{{ 'enable': ENABLE, 'layer': LAYER, 'call': MACRO }}"

[gcode_macro SET_PRINT_STATS_INFO]
rename_existing = SET_PRINT_STATS_INFO_BASE
description = Overwrite, to get pause_next_layer and pause_at_layer feature
variable_pause_next_layer = { 'enable': False, 'call': "PAUSE" }
variable_pause_at_layer = { 'enable': False, 'layer': 0, 'call': "PAUSE" }
gcode = 
	{% if pause_next_layer.enable %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_next_layer" % pause_next_layer.call}'
	{pause_next_layer.call}
	SET_PAUSE_NEXT_LAYER ENABLE=0
	{% elif pause_at_layer.enable and params.CURRENT_LAYER is defined and params.CURRENT_LAYER|int == pause_at_layer.layer %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_at_layer [%d]" % (pause_at_layer.call, pause_at_layer.layer)}'
	{pause_at_layer.call}
	SET_PAUSE_AT_LAYER ENABLE=0
	{% endif %}
	SET_PRINT_STATS_INFO_BASE {rawparams}

[gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL]
description = Helper: park toolhead used in PAUSE and CANCEL_PRINT
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set use_custom     = client.use_custom_pos|default(false)|lower == 'true' %}
	{% set custom_park_x  = client.custom_park_x|default(0.0) %}
	{% set custom_park_y  = client.custom_park_y|default(0.0) %}
	{% set park_dz        = client.custom_park_dz|default(2.0)|abs %}
	{% set sp_hop         = client.speed_hop|default(15) * 60 %}
	{% set sp_move        = client.speed_move|default(velocity) * 60 %}
	
	{% set origin    = printer.gcode_move.homing_origin %}
	{% set act       = printer.gcode_move.gcode_position %}
	{% set max       = printer.toolhead.axis_maximum %}
	{% set cone      = printer.toolhead.cone_start_z|default(max.z) %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	
	{% set z_min = params.Z_MIN|default(0)|float %}
	{% set z_park = [[(act.z + park_dz), z_min]|max, (max.z - origin.z)]|min %}
	{% set x_park = params.X       if params.X is defined
	else custom_park_x  if use_custom
	else 0.0            if round_bed
	else (max.x - 5.0) %}
	{% set y_park = params.Y       if params.Y is defined
	else custom_park_y  if use_custom
	else (max.y - 5.0)  if round_bed and z_park < cone
	else 0.0            if round_bed
	else (max.y - 5.0) %}
	
	_CLIENT_RETRACT
	{% if "xyz" in printer.toolhead.homed_axes %}
	G90
	G1 Z{z_park} F{sp_hop}
	G1 X{x_park} Y{y_park} F{sp_move}
	{% if not printer.gcode_move.absolute_coordinates %} G91 {% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='Printer not homed'
	{% endif %}

[gcode_macro _CLIENT_EXTRUDE]
description = Extrudes, if the extruder is hot enough
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set use_fw_retract = (client.use_fw_retract|default(false)|lower == 'true') and (printer.firmware_retraction is defined) %}
	{% set length = params.LENGTH|default(client.unretract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_unretract)|default(35) %}
	{% set absolute_extrude = printer.gcode_move.absolute_extrude %}
	
	{% if printer.toolhead.extruder != '' %}
	{% if printer[printer.toolhead.extruder].can_extrude %}
	{% if use_fw_retract %}
	{% if length < 0 %}
	G10
	{% else %}
	G11
	{% endif %}
	{% else %}
	M83
	G1 E{length} F{(speed|float|abs) * 60}
	{% if absolute_extrude %}
	M82
	{% endif %}
	{% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='{"\\"%s\\" not hot enough" % printer.toolhead.extruder}'
	{% endif %}
	{% endif %}

[gcode_macro _CLIENT_RETRACT]
description = Retracts, if the extruder is hot enough
gcode = 
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set length = params.LENGTH|default(client.retract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_retract)|default(35) %}
	
	_CLIENT_EXTRUDE LENGTH=-{length|float|abs} SPEED={speed|float|abs}

[gcode_macro _CLIENT_LINEAR_MOVE]
description = Linear move with save and restore of the gcode state
gcode = 
	{% set x_move = "X" ~ params.X if params.X is defined else "" %}
	{% set y_move = "Y" ~ params.Y if params.Y is defined else "" %}
	{% set z_move = "Z" ~ params.Z if params.Z is defined else "" %}
	{% set e_move = "E" ~ params.E if params.E is defined else "" %}
	{% set rate = "F" ~ params.F if params.F is defined else "" %}
	{% set ABSOLUTE = params.ABSOLUTE | default(0) | int != 0 %}
	{% set ABSOLUTE_E = params.ABSOLUTE_E | default(0) | int != 0 %}
	SAVE_GCODE_STATE NAME=_client_movement
	{% if x_move or y_move or z_move %}
	G9{ 0 if ABSOLUTE else 1 }
	{% endif %}
	{% if e_move %}
	M8{ 2 if ABSOLUTE_E else 3 }
	{% endif %}
	G1 { x_move } { y_move } { z_move } { e_move } { rate }
	RESTORE_GCODE_STATE NAME=_client_movement

[gcode_macro GET_TIMELAPSE_SETUP]
description = Print the Timelapse setup
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set output_txt = ["Timelapse Setup:"] %}
	{% set _dummy = output_txt.append("enable: %s" % tl.enable) %}
	{% set _dummy = output_txt.append("park: %s" % tl.park.enable) %}
	{% if tl.park.enable %}
	{% set _dummy = output_txt.append("park position: %s time: %s s" % (tl.park.pos, tl.park.time)) %}
	{% set _dummy = output_txt.append("park cord x:%s y:%s dz:%s" % (tl.park.coord.x, tl.park.coord.y, tl.park.coord.dz)) %}
	{% set _dummy = output_txt.append("travel speed: %s mm/s" % tl.speed.travel) %}
	{% endif %}
	{% set _dummy = output_txt.append("fw_retract: %s" % tl.extruder.fw_retract) %}
	{% if not tl.extruder.fw_retract %}
	{% set _dummy = output_txt.append("retract: %s mm speed: %s mm/s" % (tl.extruder.retract, tl.speed.retract)) %}
	{% set _dummy = output_txt.append("extrude: %s mm speed: %s mm/s" % (tl.extruder.extrude, tl.speed.extrude)) %}
	{% endif %}
	{% set _dummy = output_txt.append("verbose: %s" % tl.verbose) %}
	{action_respond_info(output_txt|join("\\n"))}

[gcode_macro _SET_TIMELAPSE_SETUP]
description = Set user parameters for timelapse
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	{% set park = {'min'   : {'x': (min.x / 1.42)|round(3) if round_bed else min.x|round(3),
	'y': (min.y / 1.42)|round(3) if round_bed else min.y|round(3)},
	'max'   : {'x': (max.x / 1.42)|round(3) if round_bed else max.x|round(3),
	'y': (max.y / 1.42)|round(3) if round_bed else max.y|round(3)},
	'center': {'x': (max.x-(max.x-min.x)/2)|round(3),
	'y': (max.y-(max.y-min.y)/2)|round(3)}} %}
	
	{% if params.ENABLE %}
	{% if params.ENABLE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=enable VALUE={True if params.ENABLE|lower == 'true' else False}
	{% else %}
	{action_raise_error("ENABLE=%s not supported. Allowed values are [True, False]" % params.ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.VERBOSE %}
	{% if params.VERBOSE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=verbose VALUE={True if params.VERBOSE|lower == 'true' else False}
	{% else %}
	{action_raise_error("VERBOSE=%s not supported. Allowed values are [True, False]" % params.VERBOSE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_X %}
	{% if params.CUSTOM_POS_X|float >= min.x and params.CUSTOM_POS_X|float <= max.x %}
	{% set _dummy = tl.park.custom.update({'x':params.CUSTOM_POS_X|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_X=%s must be within [%s - %s]" % (params.CUSTOM_POS_X, min.x, max.x))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_Y %}
	{% if params.CUSTOM_POS_Y|float >= min.y and params.CUSTOM_POS_Y|float <= max.y %}
	{% set _dummy = tl.park.custom.update({'y':params.CUSTOM_POS_Y|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_Y=%s must be within [%s - %s]" % (params.CUSTOM_POS_Y, min.y, max.y))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_DZ %}
	{% if params.CUSTOM_POS_DZ|float >= min.z and params.CUSTOM_POS_DZ|float <= max.z %}
	{% set _dummy = tl.park.custom.update({'dz':params.CUSTOM_POS_DZ|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_DZ=%s must be within [%s - %s]" % (params.CUSTOM_POS_DZ, min.z, max.z))}
	{% endif %}
	{% endif %}
	{% if params.PARK_ENABLE %}
	{% if params.PARK_ENABLE|lower is in ['true', 'false'] %}
	{% set _dummy = tl.park.update({'enable':True if params.PARK_ENABLE|lower == 'true' else False}) %}
	{% else %}
	{action_raise_error("PARK_ENABLE=%s not supported. Allowed values are [True, False]" % params.PARK_ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.PARK_POS %}
	{% if params.PARK_POS|lower is in ['center','front_left','front_right','back_left','back_right','custom','x_only','y_only'] %}
	{% set dic = {'center'      : {'x': park.center.x   , 'y': park.center.y   , 'dz': 1                },
	'front_left'  : {'x': park.min.x      , 'y': park.min.y      , 'dz': 0                },
	'front_right' : {'x': park.max.x      , 'y': park.min.y      , 'dz': 0                },
	'back_left'   : {'x': park.min.x      , 'y': park.max.y      , 'dz': 0                },
	'back_right'  : {'x': park.max.x      , 'y': park.max.y      , 'dz': 0                },
	'custom'      : {'x': tl.park.custom.x, 'y': tl.park.custom.y, 'dz': tl.park.custom.dz},
	'x_only'      : {'x': tl.park.custom.x, 'y': 'none'          , 'dz': tl.park.custom.dz},
	'y_only'      : {'x': 'none'          , 'y': tl.park.custom.y, 'dz': tl.park.custom.dz}} %}
	{% set _dummy = tl.park.update({'pos':params.PARK_POS|lower}) %}
	{% set _dummy = tl.park.update({'coord':dic[tl.park.pos]}) %}
	{% else %}
	{action_raise_error("PARK_POS=%s not supported. Allowed values are [CENTER, FRONT_LEFT, FRONT_RIGHT, BACK_LEFT, BACK_RIGHT, CUSTOM, X_ONLY, Y_ONLY]"
	% params.PARK_POS|upper)}
	{% endif %}
	{% endif %}
	{% if params.PARK_TIME %}
	{% if params.PARK_TIME|float >= 0.0 %}
	{% set _dummy = tl.park.update({'time':params.PARK_TIME|float|round(3)}) %}
	{% else %}
	{action_raise_error("PARK_TIME=%s must be a positive number" % params.PARK_TIME)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=park VALUE="{tl.park}"
	{% if params.TRAVEL_SPEED %}
	{% if params.TRAVEL_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'travel':params.TRAVEL_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("TRAVEL_SPEED=%s must be larger than 0" % params.TRAVEL_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_SPEED %}
	{% if params.RETRACT_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'retract':params.RETRACT_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_SPEED=%s must be larger than 0" % params.RETRACT_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.EXTRUDE_SPEED %}
	{% if params.EXTRUDE_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'extrude':params.EXTRUDE_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_SPEED=%s must be larger than 0" % params.EXTRUDE_SPEED)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=speed VALUE="{tl.speed}"
	{% if params.EXTRUDE_DISTANCE %}
	{% if params.EXTRUDE_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'extrude':params.EXTRUDE_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_DISTANCE=%s must be specified as positiv number" % params.EXTRUDE_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_DISTANCE %}
	{% if params.RETRACT_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'retract':params.RETRACT_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_DISTANCE=%s must be specified as positiv number" % params.RETRACT_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.FW_RETRACT %}
	{% if params.FW_RETRACT|lower is in ['true', 'false'] %}
	{% if 'firmware_retraction' in printer.configfile.settings %}
	{% set _dummy = tl.extruder.update({'fw_retract': True if params.FW_RETRACT|lower == 'true' else False}) %}
	{% else %}
	{% set _dummy = tl.extruder.update({'fw_retract':False}) %}
	{% if params.FW_RETRACT|capitalize == 'True' %}
	{action_raise_error("[firmware_retraction] not defined in printer.cfg. Can not enable fw_retract")}
	{% endif %}
	{% endif %}
	{% else %}
	{action_raise_error("FW_RETRACT=%s not supported. Allowed values are [True, False]" % params.FW_RETRACT|capitalize)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=extruder VALUE="{tl.extruder}"
	{% if printer.configfile.settings['gcode_macro pause'] is defined %}
	{% set _dummy = tl.macro.update({'pause': printer.configfile.settings['gcode_macro pause'].rename_existing}) %}
	{% endif %}
	{% if printer.configfile.settings['gcode_macro resume'] is defined %}
	{% set _dummy = tl.macro.update({'resume': printer.configfile.settings['gcode_macro resume'].rename_existing}) %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=macro VALUE="{tl.macro}"

[gcode_macro TIMELAPSE_TAKE_FRAME]
description = Take Timelapse shoot
variable_enable = False
variable_takingframe = False
variable_park = {'enable': False,
	'pos'   : 'center',
	'time'  : 0.1,
	'custom': {'x': 0, 'y': 0, 'dz': 0},
	'coord' : {'x': 0, 'y': 0, 'dz': 0}}
variable_extruder = {'fw_retract': False,
	'retract': 1.0,
	'extrude': 1.0}
variable_speed = {'travel': 100,
	'retract': 15,
	'extrude': 15}
variable_verbose = True
variable_check_time = 0.5
variable_restore = {'absolute': {'coordinates': True, 'extrude': True}, 'speed': 1500, 'e':0, 'factor': {'speed': 1.0, 'extrude': 1.0}}
variable_macro = {'pause': 'PAUSE', 'resume': 'RESUME'}
variable_is_paused = False
gcode = 
	{% set hyperlapse = True if params.HYPERLAPSE and params.HYPERLAPSE|lower =='true' else False %}
	{% if enable %}
	{% if (hyperlapse and printer['gcode_macro HYPERLAPSE'].run) or
	(not hyperlapse and not printer['gcode_macro HYPERLAPSE'].run) %}
	{% if park.enable %}
	{% set pos = {'x': 'X' + park.coord.x|string if park.pos != 'y_only' else '',
	'y': 'Y' + park.coord.y|string if park.pos != 'x_only' else '',
	'z': 'Z'+ [printer.gcode_move.gcode_position.z + park.coord.dz, printer.toolhead.axis_maximum.z]|min|string} %}
	{% set restore = {'absolute': {'coordinates': printer.gcode_move.absolute_coordinates,
	'extrude'    : printer.gcode_move.absolute_extrude},
	'speed'   : printer.gcode_move.speed,
	'e'       : printer.gcode_move.gcode_position.e,
	'factor'  : {'speed'  : printer.gcode_move.speed_factor,
	'extrude': printer.gcode_move.extrude_factor}} %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=restore VALUE="{restore}"
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, minimum extruder temperature not reached!")}{% endif %}
	{% else %}
	{% if extruder.fw_retract %}
	G10
	{% else %}
	M83
	G0 E-{extruder.retract} F{speed.retract * 60}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=True
	{macro.pause}
	SET_GCODE_OFFSET X=0 Y=0
	G90
	{% if "xyz" not in printer.toolhead.homed_axes %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, axis not homed yet!")}{% endif %}
	{% else %}
	G0 {pos.x} {pos.y} {pos.z} F{speed.travel * 60}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=takingframe VALUE=True
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={check_time}
	M400
	{% endif %}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE={hyperlapse}
	{% endif %}
	{% else %}
	{% if verbose %}{action_respond_info("Timelapse: disabled, take frame ignored")}{% endif %}
	{% endif %}

[gcode_macro _TIMELAPSE_NEW_FRAME]
description = action call for timelapse shoot. must be a seperate macro
gcode = 
	{action_call_remote_method("timelapse_newframe",
	macropark=printer['gcode_macro TIMELAPSE_TAKE_FRAME'].park,
	hyperlapse=params.HYPERLAPSE)}

[delayed_gcode _WAIT_TIMELAPSE_TAKE_FRAME]
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set factor = {'speed': printer.gcode_move.speed_factor, 'extrude': printer.gcode_move.extrude_factor} %}
	{% if tl.takingframe %}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={tl.check_time}
	{% else %}
	{tl.macro.resume} VELOCITY={tl.speed.travel}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=False
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{action_respond_info("Timelapse: Warning minimum extruder temperature not reached!")}
	{% else %}
	{% if tl.extruder.fw_retract %}
	G11
	{% else %}
	G0 E{tl.extruder.extrude} F{tl.speed.extrude * 60}
	G0 F{tl.restore.speed}
	{% if tl.restore.absolute.extrude %}
	M82
	G92 E{tl.restore.e}
	{% endif %}
	{% endif %}
	{% endif %}
	{% if tl.restore.factor.speed   != factor.speed   %} M220 S{(factor.speed*100)|round(0)}   {% endif %}
	{% if tl.restore.factor.extrude != factor.extrude %} M221 S{(factor.extrude*100)|round(0)} {% endif %}
	{% if not tl.restore.absolute.coordinates %} G91 {% endif %}
	{% endif %}

[gcode_macro HYPERLAPSE]
description = Start/Stop a hyperlapse recording
variable_cycle = 0
variable_run = False
gcode = 
	{% set cycle = params.CYCLE|default(30)|int %}
	{% if params.ACTION and params.ACTION|lower == 'start' %}
	{action_respond_info("Hyperlapse: frames started (Cycle %d sec)" % cycle)}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=True
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=cycle VALUE={cycle}
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True
	{% elif params.ACTION and params.ACTION|lower == 'stop' %}
	{% if run %}{action_respond_info("Hyperlapse: frames stopped")}{% endif %}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=False
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION=0
	{% else %}
	{action_raise_error("Hyperlapse: No valid input parameter
	Use:
	- HYPERLAPSE ACTION=START [CYCLE=time]
	- HYPERLAPSE ACTION=STOP")}
	{% endif %}

[delayed_gcode _HYPERLAPSE_LOOP]
gcode = 
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={printer["gcode_macro HYPERLAPSE"].cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True

[gcode_macro TIMELAPSE_RENDER]
description = Render Timelapse video and wait for the result
variable_render = False
variable_run_identifier = 0
gcode = 
	{action_respond_info("Timelapse: Rendering started")}
	{action_call_remote_method("timelapse_render", byrendermacro="True")}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=render VALUE=True
	{printer.configfile.settings['gcode_macro pause'].rename_existing}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5

[delayed_gcode _WAIT_TIMELAPSE_RENDER]
gcode = 
	{% set ri = printer['gcode_macro TIMELAPSE_RENDER'].run_identifier % 4 %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=run_identifier VALUE={ri + 1}
	{% if printer['gcode_macro TIMELAPSE_RENDER'].render %}
	M117 Rendering {['-','\\\\','|','/'][ri]}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5
	{% else %}
	{action_respond_info("Timelapse: Rendering finished")}
	M117
	{printer.configfile.settings['gcode_macro resume'].rename_existing}
	{% endif %}

[gcode_macro TEST_STREAM_DELAY]
description = Helper macro to find stream and park delay
gcode = 
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set act = printer.toolhead.position %}
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% if act.z > 5.0 %}
	G0 X{min.x + 5.0} F{tl.speed.travel|int * 60}
	G0 X{(max.x-min.x)/2}
	G4 P{tl.park.time|float * 1000}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE=FALSE
	G0 X{max.x - 5.0}
	{% else %}
	{action_raise_error("Toolhead z %.3f to low. Please place head above z = 5.0" % act.z)}
	{% endif %}

[gcode_macro PIDcalibrate]
gcode = 
	PID_CALIBRATE HEATER=extruder TARGET=235
	PID_CALIBRATE HEATER=heater_bed TARGET=80

[gcode_macro POWER_OFF_PRINTER]
gcode = 
	{action_call_remote_method( "set_device_power", device="printer_plug", state="off")}

[gcode_macro START_PRINT]
gcode = 
	{% set BED_TEMP = params.BED_TEMP|default(60)|float %}
	
	{% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(190)|float %}
	
	M140 S{BED_TEMP}
	
	G90
	
	G28
	
	G1 Z5 F3000
	BED_MESH_PROFILE LOAD=default
	
	M190 S{BED_TEMP}
	
	M109 S{EXTRUDER_TEMP}
	M117 Purge extruder
	G1 X25 Y20 Z0.3 F5000.0
	G1 X25 Y175.0 Z0.3 F1500.0 E15
	G1 X25 Y175.0 Z0.4 F5000.0
	G1 X25 Y20 Z0.4 F1500.0 E30
	G92 E0
	G1 Z1.0 F3000

[gcode_macro END_PRINT]
gcode = 
	
	M140 S0
	M104 S0
	
	M106 S0
	
	G91
	G1 X-2 Y-2 E-3 F300
	
	G1 Z10 F3000
	G90
	
	M84
	BED_MESH_CLEAR

[gcode_macro CALCULATE_BED_MESH]
description = Calculate bed_mesh boundaries automatically based on your bltouch/probe config
gcode = 
	{% set BED_MESH_MARGIN = params.BED_MESH_MARGIN|default(10)|float %}
	
	{% set X_MAX = printer.toolhead.axis_maximum.x|default(230)|float %}
	{% set Y_MAX = printer.toolhead.axis_maximum.y|default(230)|float %}
	
	{% set X_OFFSET = 0.0 |float %}
	{% set Y_OFFSET = 0.0 |float %}
	
	{% if printer.configfile.config["bltouch"] is defined %}
	{% set X_OFFSET = (printer.configfile.settings.bltouch.x_offset if printer.configfile.settings.bltouch.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.settings.bltouch.y_offset if printer.configfile.settings.bltouch.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	{% if printer.configfile.config["probe"] is defined %}
	{% set X_OFFSET = (printer.configfile.config.probe.x_offset if printer.configfile.config.probe.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.config.probe.y_offset if printer.configfile.config.probe.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	
	
	
	{% set BED_MESH_MIN_X = BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MIN_Y = BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_X = X_MAX - (X_OFFSET)|abs - BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_MAX - BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_Y = Y_MAX - (Y_OFFSET)|abs - BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_MAX - BED_MESH_MARGIN |float %}
	
	
	{action_respond_info("BED_MESH_MARGIN : %f" % (BED_MESH_MARGIN))}
	{action_respond_info("X_MAX           : %f" % (X_MAX))}
	{action_respond_info("Y_MAX           : %f" % (Y_MAX))}
	{action_respond_info("X_OFFSET        : %f" % (X_OFFSET))}
	{action_respond_info("Y_OFFSET        : %f" % (Y_OFFSET))}
	{action_respond_info("BED_MESH_MIN_X  : %f" % (BED_MESH_MIN_X))}
	{action_respond_info("BED_MESH_MIN_Y  : %f" % (BED_MESH_MIN_Y))}
	{action_respond_info("BED_MESH_MAX_X  : %f" % (BED_MESH_MAX_X))}
	{action_respond_info("BED_MESH_MAX_Y  : %f" % (BED_MESH_MAX_Y))}
	{action_respond_info("--- VALUES TO ADD OR UPDATE TO OUR BED_MESH VALUES ---")}
	{action_respond_info("--- VALORES PARA AGREGAR O ACTUALIZAR EN NUESTRA SECCIÓN BED_MESH ---")}
	{action_respond_info("mesh_max: %s,%s" % (BED_MESH_MAX_X,BED_MESH_MAX_Y))}
	{action_respond_info("mesh_min: %s,%s" % (BED_MESH_MIN_X,BED_MESH_MIN_Y))}

[gcode_macro PID_EXTRUDER]
description = PID Tune for the Extruder
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set T = params.TEMPERATURE|default(210)|float %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set P = printer.configfile.config[e].pid_kp|float %}
	{% set I = printer.configfile.config[e].pid_ki|float %}
	{% set D = printer.configfile.config[e].pid_kd|float %}
	M118 Homing...
	G28
	M106 S{S}
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Extruder PID calibration...
	PID_CALIBRATE HEATER={e} TARGET={T}
	TURN_OFF_HEATERS
	M107
	SAVE_CONFIG

[gcode_macro PID_BED]
description = PID Tune for the Bed
gcode = 
	{% set T = params.TEMPERATURE|default(60)|float %}
	{% set P = printer.configfile.config['heater_bed'].pid_kp|float %}
	{% set I = printer.configfile.config['heater_bed'].pid_ki|float %}
	{% set D = printer.configfile.config['heater_bed'].pid_kd|float %}
	M118 Homing...
	G28
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={T}
	TURN_OFF_HEATERS
	SAVE_CONFIG

[gcode_macro PID_ALL]
description = Heater and Bed temperature calibration. Usage: PID_ALL [TE=temperature] [TB=temperature]\\n Calibra la temperatura del extrusor y la cama. Uso: PID_ALL [TE=temperatura] [TB=temperature]
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set TE = params.TE|default(195)|int %}
	{% set TB = params.TB|default(45)|int %}
	M118 Homing...
	G28
	M118 Extruder PID calibration...
	M106 S{S}
	PID_CALIBRATE HEATER={e} TARGET={TE}
	M107
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={TB}
	SAVE_CONFIG

[tmc2209 stepper_x]
uart_pin = PE6
run_current = 0.9
diag_pin = ^PA15
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_y]
uart_pin = PE3
run_current = 0.9
diag_pin = ^PD2
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_z]
uart_pin = PB7
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 stepper_z1]
uart_pin = PD4
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 extruder]
uart_pin = PB3
run_current = 0.842
diag_pin = 
stealthchop_threshold = 0

[mcu eddy]
serial = /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00
restart_method = command

[temperature_sensor btt_eddy_mcu]
sensor_type = temperature_mcu
sensor_mcu = eddy
min_temp = 10
max_temp = 100

[probe_eddy_current btt_eddy]
sensor_type = ldc1612
z_offset = 2.5
i2c_mcu = eddy
i2c_bus = i2c0f
x_offset = -30
y_offset = 5
reg_drive_current = 16
calibrate = 
	0.050188:3205933.097,0.090337:3205145.727,0.130487:3204354.163,
	0.169383:3203615.123,0.209533:3202860.267,0.249683:3202120.825,
	0.289833:3201389.932,0.329983:3200675.781,0.370133:3199937.342,
	0.410283:3199271.075,0.450433:3198562.823,0.490583:3197906.664,
	0.529478:3197264.891,0.569628:3196643.334,0.609778:3195982.110,
	0.649928:3195394.352,0.690078:3194737.336,0.730228:3194161.411,
	0.770378:3193564.178,0.810528:3192980.830,0.849423:3192409.769,
	0.889573:3191874.493,0.929723:3191327.866,0.969873:3190787.673,
	1.010023:3190232.313,1.050173:3189727.474,1.090323:3189210.067,
	1.130473:3188739.481,1.170623:3188237.257,1.209519:3187753.422,
	1.249669:3187291.436,1.289819:3186821.547,1.329969:3186360.473,
	1.370119:3185924.800,1.410269:3185491.381,1.450419:3185053.330,
	1.490569:3184594.190,1.529464:3184205.277,1.569614:3183785.498,
	1.609764:3183350.340,1.649914:3182966.762,1.690064:3182588.711,
	1.730214:3182190.755,1.770364:3181813.670,1.810514:3181420.036,
	1.849409:3181087.634,1.889559:3180703.858,1.929709:3180363.438,
	1.969859:3180003.082,2.010009:3179664.903,2.050159:3179332.781,
	2.090309:3178990.508,2.130459:3178673.256,2.170609:3178345.224,
	2.209505:3178050.416,2.249655:3177734.057,2.289805:3177419.463,
	2.329955:3177136.203,2.370105:3176837.527,2.410255:3176546.139,
	2.450405:3176268.706,2.490555:3175972.146,2.529450:3175723.811,
	2.569600:3175470.080,2.609750:3175223.081,2.649900:3174962.842,
	2.690050:3174704.198,2.730200:3174460.913,2.770350:3174228.920,
	2.810500:3173989.118,2.849395:3173761.350,2.889545:3173516.616,
	2.929695:3173309.604,2.969845:3173089.770,3.009995:3172877.982,
	3.050145:3172644.639,3.090295:3172452.377,3.130445:3172252.422,
	3.170595:3172031.650,3.209491:3171857.260,3.249641:3171650.997,
	3.289791:3171441.897,3.329941:3171248.522,3.370091:3171071.032,
	3.410241:3170902.167,3.450391:3170700.892,3.490541:3170509.888,
	3.529436:3170367.070,3.569586:3170188.460,3.609736:3170015.379,
	3.649886:3169825.355,3.690036:3169687.899,3.730186:3169514.422,
	3.770336:3169378.249,3.810486:3169199.096,3.849381:3169055.600,
	3.889531:3168906.908,3.929681:3168770.855,3.969831:3168587.431,
	4.009981:3168461.835,4.050131:3168313.942

[temperature_probe btt_eddy]
sensor_type = Generic 3950
sensor_pin = eddy:gpio26
horizontal_move_z = 2
calibration_temp = 29.941653
drift_calibration = 
	3322659.134314, -5564.540372, 60.398093
	3204466.582019, -381.239579, 3.440192
	3191594.449302, -119.470102, 1.125202
	3183159.664481, 17.721542, -0.153070
	3176791.037916, 107.407930, -0.957123
	3171474.720102, 190.159212, -1.751515
	3166582.715676, 281.955770, -2.675074
	3163316.106670, 318.670366, -2.988620
	3160957.710763, 338.412885, -3.164299
drift_calibration_min_temp = 33.83103284492943

[bed_mesh]
speed = 50
horizontal_move_z = 1
mesh_min = 50,60
mesh_max = 280, 310
probe_count = 9, 9
mesh_pps = 3, 3
algorithm = bicubic
bicubic_tension = 0.2

[safe_z_home]
home_xy_position = 204, 185
speed = 50
z_hop = 10
z_hop_speed = 10

[save_variables]
filename = ~/printer_data/config/variables.cfg

[force_move]
enable_force_move = True

[delayed_gcode RESTORE_PROBE_OFFSET]
initial_duration = 1.
gcode = 
	{% set svv = printer.save_variables.variables %}
	{% if not printer["gcode_macro SET_GCODE_OFFSET"].restored %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ svv.nvm_offset|default(0) }
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=restored VALUE=True
	{% endif %}

[gcode_macro G28]
rename_existing = G28.1
gcode = 
	
	G28.1 {rawparams}
	{% if not rawparams or (rawparams and 'Z' in rawparams) %}
	PROBE
	SET_Z_FROM_PROBE
	{% endif %}

[gcode_macro SET_Z_FROM_PROBE]
gcode = 
	{% set cf = printer.configfile.settings %}
	SET_GCODE_OFFSET_ORIG Z={printer.probe.last_z_result - cf['probe_eddy_current btt_eddy'].z_offset + printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset}
	G90
	G1 Z{cf.safe_z_home.z_hop}

[gcode_macro Z_OFFSET_APPLY_PROBE]
rename_existing = Z_OFFSET_APPLY_PROBE_ORIG
gcode = 
	SAVE_VARIABLE VARIABLE=nvm_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset }

[gcode_macro SET_GCODE_OFFSET]
rename_existing = SET_GCODE_OFFSET_ORIG
variable_restored = False
variable_runtime_offset = 0
gcode = 
	{% if params.Z_ADJUST %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset + params.Z_ADJUST|float }
	{% endif %}
	{% if params.Z %}
	{% set paramList = rawparams.split() %}
	{% for i in range(paramList|length) %}
	{% if paramList[i]=="Z=0" %}
	{% set temp=paramList.pop(i) %}
	{% set temp="Z_ADJUST=" + (-printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset)|string %}
	{% if paramList.append(temp) %}{% endif %}
	{% endif %}
	{% endfor %}
	{% set rawparams=paramList|join(' ') %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE=0
	{% endif %}
	SET_GCODE_OFFSET_ORIG { rawparams }

[gcode_macro PROBE_EDDY_CURRENT_CALIBRATE_AUTO]
gcode = 
	BED_MESH_CLEAR
	G28 X Y
	G90
	G1 X{ printer.toolhead.axis_maximum.x/2 } Y{ printer.toolhead.axis_maximum.y/2 } F6000
	{% if 'z' not in printer.toolhead.homed_axes %}
	SET_KINEMATIC_POSITION Z={ printer.toolhead.axis_maximum.z-1 }
	{% endif %}
	PROBE_EDDY_CURRENT_CALIBRATE {rawparams}

[mcu]
serial = /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00

[stepper_x]
step_pin = PC14
dir_pin = !PC13
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA14
position_endstop = 0
position_min = 0
position_max = 330
homing_speed = 50

[stepper_y]
step_pin = PE5
dir_pin = PE4
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA15
position_endstop = 0
position_min = 0
position_max = 320
homing_speed = 50

[stepper_z1]
step_pin = PE1
dir_pin = PE0
enable_pin = !PE2
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop

[stepper_z]
step_pin = PD6
dir_pin = PD5
enable_pin = !PD7
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop
position_max = 400
position_min = -5
homing_speed = 10

[screws_tilt_adjust]
screw1 = 204,185
screw1_name = Central screw
screw2 = 105,84
screw2_name = Front left screw
screw3 = 305,84
screw3_name = Rear left screw
screw4 = 305,284
screw4_name = Front right screw
screw5 = 105, 284
screw5_name = Rear right screw
horizontal_move_z = 10
speed = 100
screw_thread = CW-M3

[bed_screws]
screw1 = 50,70
screw2 = 250,70
screw3 = 250, 230
screw4 = 50, 230

[z_tilt]
z_positions = -60, 155
	330, 155
points = 70, 184
	300, 184
speed = 100
horizontal_move_z = 10
retries = 8
retry_tolerance = 0.005

[extruder]
step_pin = PB5
dir_pin = !PB4
enable_pin = !PB6
microsteps = 16
rotation_distance = 8.06
nozzle_diameter = 0.400
filament_diameter = 1.750
heater_pin = PB1
sensor_type = ATC Semitec 104GT-2
sensor_pin = PC1
max_extrude_only_distance = 100000
min_temp = 0
max_temp = 260
pressure_advance = 0.08
control = pid
pid_kp = 39.588
pid_ki = 7.762
pid_kd = 50.475

[heater_bed]
heater_pin = PB10
sensor_type = ATC Semitec 104NT-4-R025H42G
sensor_pin = PC0
min_temp = 0
max_temp = 130
control = pid
pid_kp = 57.129
pid_ki = 2.026
pid_kd = 402.756
x_count = 4
y_count = 4
mesh_x_pps = 2
mesh_y_pps = 2
algo = bicubic
tension = 0.2
min_x = 40.0
max_x = 256.0
min_y = 60.0
max_y = 279.98999999999995

[fan]
pin = PA2
max_power = 1.0
off_below = 0.1

[heater_fan hotend]
pin = PA0
heater = extruder
heater_temp = 50.0
fan_speed = 1.0
shutdown_speed = 1.0

[printer]
kinematics = cartesian
max_velocity = 250
max_accel = 4500
max_z_velocity = 25
max_z_accel = 100

[skew_correction]

[bed_mesh default]
version = 1
points = 
	0.077380, 0.111423, 0.114676, 0.156457, 0.174093, 0.168682, 0.150091, 0.125241, 0.144394
	0.019770, 0.035236, 0.040041, 0.064163, 0.097841, 0.072235, 0.036121, 0.038328, -0.022320
	-0.046588, -0.004041, -0.002183, 0.034924, 0.056260, 0.057109, 0.025641, -0.003699, 0.000421
	-0.014058, -0.015146, -0.014967, 0.007296, 0.033845, 0.025323, -0.004179, -0.028621, -0.045631
	-0.053217, -0.062006, -0.048567, -0.019670, -0.003835, 0.000873, -0.021848, -0.046722, -0.038119
	-0.082454, -0.064824, -0.071665, -0.049962, -0.027577, -0.036043, -0.056768, -0.072205, -0.063067
	0.026282, -0.006652, -0.015925, 0.013883, 0.040249, 0.050473, 0.018200, -0.017486, -0.044483
	0.006865, 0.029730, 0.028595, 0.044249, 0.088176, 0.080421, 0.046590, 0.046284, 0.075516
	0.059874, -0.031578, -0.021740, 0.006004, 0.063576, 0.092164, 0.028281, -0.012436, -0.035619
x_count = 9
y_count = 9
mesh_x_pps = 3
mesh_y_pps = 3
algo = bicubic
tension = 0.2
min_x = 50.0
max_x = 280.0
min_y = 60.0
max_y = 310.0

[skew_correction mi_skew]
xy_skew = -0.00679190845337054
xz_skew = 0.0
yz_skew = 0.0
=======================
temperature_probe btt_eddy: loaded temperature drift calibration. Min Temp: 33.83, Min Freq: 3156001.351363
y(x) = 60.398093x^2 - 5564.540372x + 3322659.134314
y(x) = 3.440192x^2 - 381.239579x + 3204466.582019
y(x) = 1.125202x^2 - 119.470102x + 3191594.449302
y(x) = -0.153070x^2 + 17.721542x + 3183159.664481
y(x) = -0.957123x^2 + 107.407930x + 3176791.037916
y(x) = -1.751515x^2 + 190.159212x + 3171474.720102
y(x) = -2.675074x^2 + 281.955770x + 3166582.715676
y(x) = -2.988620x^2 + 318.670366x + 3163316.106670
y(x) = -3.164299x^2 + 338.412885x + 3160957.710763
temperature_probe btt_eddy: registered drift compensation with probe [probe_eddy_current btt_eddy]
Extruder max_extrude_ratio=0.266081
mcu 'mcu': Starting serial connect
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
webhooks client 547616950608: New connection
webhooks client 547616950608: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
Loaded MCU 'mcu' 144 commands (v0.13.0-320-gc80324946 / gcc: (15:12.2.rel1-1) 12.2.1 20221205 binutils: (2.40-2+18+b1) 2.40)
MCU 'mcu' config: ADC_MAX=4095 BUS_PINS_i2c1=PB6,PB7 BUS_PINS_i2c1a=PB8,PB9 BUS_PINS_i2c2=PB10,PB11 BUS_PINS_i2c2_PF1_PF0=PF1,PF0 BUS_PINS_i2c2a=PH4,PH5 BUS_PINS_i2c3=PA8,PC9 BUS_PINS_i2c3a=PH7,PH8 BUS_PINS_sdio=PC12,PD2,PC8,PC9,PC10,PC11 BUS_PINS_spi1=PA6,PA7,PA5 BUS_PINS_spi1_PA6_PA7_PA5=PA6,PA7,PA5 BUS_PINS_spi1_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi1a=PB4,PB5,PB3 BUS_PINS_spi2=PB14,PB15,PB13 BUS_PINS_spi2_PB14_PB15_PB13=PB14,PB15,PB13 BUS_PINS_spi2_PC2_PC3_PB10=PC2,PC3,PB10 BUS_PINS_spi2_PI2_PI3_PI1=PI2,PI3,PI1 BUS_PINS_spi2a=PC2,PC3,PB10 BUS_PINS_spi2b=PI2,PI3,PI1 BUS_PINS_spi3=PB4,PB5,PB3 BUS_PINS_spi3_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi3_PC11_PC12_PC10=PC11,PC12,PC10 BUS_PINS_spi3a=PC11,PC12,PC10 CLOCK_FREQ=168000000 MCU=stm32f407xx PWM_MAX=257 RESERVE_PINS_USB=PA11,PA12 RESERVE_PINS_crystal=PH0,PH1 STATS_SUMSQ_BASE=256 STEPPER_OPTIMIZED_EDGE=21 STEPPER_STEP_BOTH_EDGE=1
mcu 'eddy': Starting serial connect
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
webhooks client 547616950608: Disconnected
Restarting printer
Start printer at Thu Jan  8 15:58:37 2026 (1767887917.7 99.3)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if last_extruder_temp.restore %}
	
	RESPOND TYPE=echo MSG='{"Restoring \\"%s\\" temperature to %3.1f\\u00B0C, this may take some time" % (printer.toolhead.extruder, last_extruder_temp.temp) }'
	M109 S{last_extruder_temp.temp}
	{% set do_resume = True %}
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	{% if runout_resume %}
	{% if do_resume %}
	{% if restore_idle_timeout > 0 %} SET_IDLE_TIMEOUT TIMEOUT={restore_idle_timeout} {% endif %}
	{client.user_resume_macro|default("")}
	_CLIENT_EXTRUDE
	RESUME_BASE VELOCITY={params.VELOCITY|default(sp_move)}
	{% endif %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]}'
	{% set _d = prompt_txt.append("\\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]) %}
	{% endif %}
	
	{% if not (runout_resume and do_resume) %}
	RESPOND TYPE=command MSG="action:prompt_begin RESUME aborted !!!"
	{% for element in prompt_txt %}
	RESPOND TYPE=command MSG='{"action:prompt_text %s" % element}'
	{% endfor %}
	RESPOND TYPE=command MSG="action:prompt_footer_button Ok|RESPOND TYPE=command MSG=action:prompt_end|info"
	RESPOND TYPE=command MSG="action:prompt_show"
	{% endif %}

[gcode_macro SET_PAUSE_NEXT_LAYER]
description = Enable a pause if the next layer is reached
gcode = 
	{% set pause_next_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_next_layer %}
	{% set ENABLE = params.ENABLE|default(1)|int != 0 %}
	{% set MACRO = params.MACRO|default(pause_next_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_next_layer VALUE="{{ 'enable': ENABLE, 'call': MACRO }}"

[gcode_macro SET_PAUSE_AT_LAYER]
description = Enable/disable a pause if a given layer number is reached
gcode = 
	{% set pause_at_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_at_layer %}
	{% set ENABLE = params.ENABLE|int != 0 if params.ENABLE is defined
	else params.LAYER is defined %}
	{% set LAYER = params.LAYER|default(pause_at_layer.layer)|int %}
	{% set MACRO = params.MACRO|default(pause_at_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_at_layer VALUE="{{ 'enable': ENABLE, 'layer': LAYER, 'call': MACRO }}"

[gcode_macro SET_PRINT_STATS_INFO]
rename_existing = SET_PRINT_STATS_INFO_BASE
description = Overwrite, to get pause_next_layer and pause_at_layer feature
variable_pause_next_layer = { 'enable': False, 'call': "PAUSE" }
variable_pause_at_layer = { 'enable': False, 'layer': 0, 'call': "PAUSE" }
gcode = 
	{% if pause_next_layer.enable %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_next_layer" % pause_next_layer.call}'
	{pause_next_layer.call}
	SET_PAUSE_NEXT_LAYER ENABLE=0
	{% elif pause_at_layer.enable and params.CURRENT_LAYER is defined and params.CURRENT_LAYER|int == pause_at_layer.layer %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_at_layer [%d]" % (pause_at_layer.call, pause_at_layer.layer)}'
	{pause_at_layer.call}
	SET_PAUSE_AT_LAYER ENABLE=0
	{% endif %}
	SET_PRINT_STATS_INFO_BASE {rawparams}

[gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL]
description = Helper: park toolhead used in PAUSE and CANCEL_PRINT
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set use_custom     = client.use_custom_pos|default(false)|lower == 'true' %}
	{% set custom_park_x  = client.custom_park_x|default(0.0) %}
	{% set custom_park_y  = client.custom_park_y|default(0.0) %}
	{% set park_dz        = client.custom_park_dz|default(2.0)|abs %}
	{% set sp_hop         = client.speed_hop|default(15) * 60 %}
	{% set sp_move        = client.speed_move|default(velocity) * 60 %}
	
	{% set origin    = printer.gcode_move.homing_origin %}
	{% set act       = printer.gcode_move.gcode_position %}
	{% set max       = printer.toolhead.axis_maximum %}
	{% set cone      = printer.toolhead.cone_start_z|default(max.z) %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	
	{% set z_min = params.Z_MIN|default(0)|float %}
	{% set z_park = [[(act.z + park_dz), z_min]|max, (max.z - origin.z)]|min %}
	{% set x_park = params.X       if params.X is defined
	else custom_park_x  if use_custom
	else 0.0            if round_bed
	else (max.x - 5.0) %}
	{% set y_park = params.Y       if params.Y is defined
	else custom_park_y  if use_custom
	else (max.y - 5.0)  if round_bed and z_park < cone
	else 0.0            if round_bed
	else (max.y - 5.0) %}
	
	_CLIENT_RETRACT
	{% if "xyz" in printer.toolhead.homed_axes %}
	G90
	G1 Z{z_park} F{sp_hop}
	G1 X{x_park} Y{y_park} F{sp_move}
	{% if not printer.gcode_move.absolute_coordinates %} G91 {% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='Printer not homed'
	{% endif %}

[gcode_macro _CLIENT_EXTRUDE]
description = Extrudes, if the extruder is hot enough
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set use_fw_retract = (client.use_fw_retract|default(false)|lower == 'true') and (printer.firmware_retraction is defined) %}
	{% set length = params.LENGTH|default(client.unretract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_unretract)|default(35) %}
	{% set absolute_extrude = printer.gcode_move.absolute_extrude %}
	
	{% if printer.toolhead.extruder != '' %}
	{% if printer[printer.toolhead.extruder].can_extrude %}
	{% if use_fw_retract %}
	{% if length < 0 %}
	G10
	{% else %}
	G11
	{% endif %}
	{% else %}
	M83
	G1 E{length} F{(speed|float|abs) * 60}
	{% if absolute_extrude %}
	M82
	{% endif %}
	{% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='{"\\"%s\\" not hot enough" % printer.toolhead.extruder}'
	{% endif %}
	{% endif %}

[gcode_macro _CLIENT_RETRACT]
description = Retracts, if the extruder is hot enough
gcode = 
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set length = params.LENGTH|default(client.retract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_retract)|default(35) %}
	
	_CLIENT_EXTRUDE LENGTH=-{length|float|abs} SPEED={speed|float|abs}

[gcode_macro _CLIENT_LINEAR_MOVE]
description = Linear move with save and restore of the gcode state
gcode = 
	{% set x_move = "X" ~ params.X if params.X is defined else "" %}
	{% set y_move = "Y" ~ params.Y if params.Y is defined else "" %}
	{% set z_move = "Z" ~ params.Z if params.Z is defined else "" %}
	{% set e_move = "E" ~ params.E if params.E is defined else "" %}
	{% set rate = "F" ~ params.F if params.F is defined else "" %}
	{% set ABSOLUTE = params.ABSOLUTE | default(0) | int != 0 %}
	{% set ABSOLUTE_E = params.ABSOLUTE_E | default(0) | int != 0 %}
	SAVE_GCODE_STATE NAME=_client_movement
	{% if x_move or y_move or z_move %}
	G9{ 0 if ABSOLUTE else 1 }
	{% endif %}
	{% if e_move %}
	M8{ 2 if ABSOLUTE_E else 3 }
	{% endif %}
	G1 { x_move } { y_move } { z_move } { e_move } { rate }
	RESTORE_GCODE_STATE NAME=_client_movement

[gcode_macro GET_TIMELAPSE_SETUP]
description = Print the Timelapse setup
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set output_txt = ["Timelapse Setup:"] %}
	{% set _dummy = output_txt.append("enable: %s" % tl.enable) %}
	{% set _dummy = output_txt.append("park: %s" % tl.park.enable) %}
	{% if tl.park.enable %}
	{% set _dummy = output_txt.append("park position: %s time: %s s" % (tl.park.pos, tl.park.time)) %}
	{% set _dummy = output_txt.append("park cord x:%s y:%s dz:%s" % (tl.park.coord.x, tl.park.coord.y, tl.park.coord.dz)) %}
	{% set _dummy = output_txt.append("travel speed: %s mm/s" % tl.speed.travel) %}
	{% endif %}
	{% set _dummy = output_txt.append("fw_retract: %s" % tl.extruder.fw_retract) %}
	{% if not tl.extruder.fw_retract %}
	{% set _dummy = output_txt.append("retract: %s mm speed: %s mm/s" % (tl.extruder.retract, tl.speed.retract)) %}
	{% set _dummy = output_txt.append("extrude: %s mm speed: %s mm/s" % (tl.extruder.extrude, tl.speed.extrude)) %}
	{% endif %}
	{% set _dummy = output_txt.append("verbose: %s" % tl.verbose) %}
	{action_respond_info(output_txt|join("\\n"))}

[gcode_macro _SET_TIMELAPSE_SETUP]
description = Set user parameters for timelapse
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	{% set park = {'min'   : {'x': (min.x / 1.42)|round(3) if round_bed else min.x|round(3),
	'y': (min.y / 1.42)|round(3) if round_bed else min.y|round(3)},
	'max'   : {'x': (max.x / 1.42)|round(3) if round_bed else max.x|round(3),
	'y': (max.y / 1.42)|round(3) if round_bed else max.y|round(3)},
	'center': {'x': (max.x-(max.x-min.x)/2)|round(3),
	'y': (max.y-(max.y-min.y)/2)|round(3)}} %}
	
	{% if params.ENABLE %}
	{% if params.ENABLE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=enable VALUE={True if params.ENABLE|lower == 'true' else False}
	{% else %}
	{action_raise_error("ENABLE=%s not supported. Allowed values are [True, False]" % params.ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.VERBOSE %}
	{% if params.VERBOSE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=verbose VALUE={True if params.VERBOSE|lower == 'true' else False}
	{% else %}
	{action_raise_error("VERBOSE=%s not supported. Allowed values are [True, False]" % params.VERBOSE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_X %}
	{% if params.CUSTOM_POS_X|float >= min.x and params.CUSTOM_POS_X|float <= max.x %}
	{% set _dummy = tl.park.custom.update({'x':params.CUSTOM_POS_X|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_X=%s must be within [%s - %s]" % (params.CUSTOM_POS_X, min.x, max.x))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_Y %}
	{% if params.CUSTOM_POS_Y|float >= min.y and params.CUSTOM_POS_Y|float <= max.y %}
	{% set _dummy = tl.park.custom.update({'y':params.CUSTOM_POS_Y|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_Y=%s must be within [%s - %s]" % (params.CUSTOM_POS_Y, min.y, max.y))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_DZ %}
	{% if params.CUSTOM_POS_DZ|float >= min.z and params.CUSTOM_POS_DZ|float <= max.z %}
	{% set _dummy = tl.park.custom.update({'dz':params.CUSTOM_POS_DZ|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_DZ=%s must be within [%s - %s]" % (params.CUSTOM_POS_DZ, min.z, max.z))}
	{% endif %}
	{% endif %}
	{% if params.PARK_ENABLE %}
	{% if params.PARK_ENABLE|lower is in ['true', 'false'] %}
	{% set _dummy = tl.park.update({'enable':True if params.PARK_ENABLE|lower == 'true' else False}) %}
	{% else %}
	{action_raise_error("PARK_ENABLE=%s not supported. Allowed values are [True, False]" % params.PARK_ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.PARK_POS %}
	{% if params.PARK_POS|lower is in ['center','front_left','front_right','back_left','back_right','custom','x_only','y_only'] %}
	{% set dic = {'center'      : {'x': park.center.x   , 'y': park.center.y   , 'dz': 1                },
	'front_left'  : {'x': park.min.x      , 'y': park.min.y      , 'dz': 0                },
	'front_right' : {'x': park.max.x      , 'y': park.min.y      , 'dz': 0                },
	'back_left'   : {'x': park.min.x      , 'y': park.max.y      , 'dz': 0                },
	'back_right'  : {'x': park.max.x      , 'y': park.max.y      , 'dz': 0                },
	'custom'      : {'x': tl.park.custom.x, 'y': tl.park.custom.y, 'dz': tl.park.custom.dz},
	'x_only'      : {'x': tl.park.custom.x, 'y': 'none'          , 'dz': tl.park.custom.dz},
	'y_only'      : {'x': 'none'          , 'y': tl.park.custom.y, 'dz': tl.park.custom.dz}} %}
	{% set _dummy = tl.park.update({'pos':params.PARK_POS|lower}) %}
	{% set _dummy = tl.park.update({'coord':dic[tl.park.pos]}) %}
	{% else %}
	{action_raise_error("PARK_POS=%s not supported. Allowed values are [CENTER, FRONT_LEFT, FRONT_RIGHT, BACK_LEFT, BACK_RIGHT, CUSTOM, X_ONLY, Y_ONLY]"
	% params.PARK_POS|upper)}
	{% endif %}
	{% endif %}
	{% if params.PARK_TIME %}
	{% if params.PARK_TIME|float >= 0.0 %}
	{% set _dummy = tl.park.update({'time':params.PARK_TIME|float|round(3)}) %}
	{% else %}
	{action_raise_error("PARK_TIME=%s must be a positive number" % params.PARK_TIME)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=park VALUE="{tl.park}"
	{% if params.TRAVEL_SPEED %}
	{% if params.TRAVEL_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'travel':params.TRAVEL_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("TRAVEL_SPEED=%s must be larger than 0" % params.TRAVEL_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_SPEED %}
	{% if params.RETRACT_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'retract':params.RETRACT_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_SPEED=%s must be larger than 0" % params.RETRACT_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.EXTRUDE_SPEED %}
	{% if params.EXTRUDE_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'extrude':params.EXTRUDE_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_SPEED=%s must be larger than 0" % params.EXTRUDE_SPEED)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=speed VALUE="{tl.speed}"
	{% if params.EXTRUDE_DISTANCE %}
	{% if params.EXTRUDE_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'extrude':params.EXTRUDE_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_DISTANCE=%s must be specified as positiv number" % params.EXTRUDE_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_DISTANCE %}
	{% if params.RETRACT_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'retract':params.RETRACT_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_DISTANCE=%s must be specified as positiv number" % params.RETRACT_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.FW_RETRACT %}
	{% if params.FW_RETRACT|lower is in ['true', 'false'] %}
	{% if 'firmware_retraction' in printer.configfile.settings %}
	{% set _dummy = tl.extruder.update({'fw_retract': True if params.FW_RETRACT|lower == 'true' else False}) %}
	{% else %}
	{% set _dummy = tl.extruder.update({'fw_retract':False}) %}
	{% if params.FW_RETRACT|capitalize == 'True' %}
	{action_raise_error("[firmware_retraction] not defined in printer.cfg. Can not enable fw_retract")}
	{% endif %}
	{% endif %}
	{% else %}
	{action_raise_error("FW_RETRACT=%s not supported. Allowed values are [True, False]" % params.FW_RETRACT|capitalize)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=extruder VALUE="{tl.extruder}"
	{% if printer.configfile.settings['gcode_macro pause'] is defined %}
	{% set _dummy = tl.macro.update({'pause': printer.configfile.settings['gcode_macro pause'].rename_existing}) %}
	{% endif %}
	{% if printer.configfile.settings['gcode_macro resume'] is defined %}
	{% set _dummy = tl.macro.update({'resume': printer.configfile.settings['gcode_macro resume'].rename_existing}) %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=macro VALUE="{tl.macro}"

[gcode_macro TIMELAPSE_TAKE_FRAME]
description = Take Timelapse shoot
variable_enable = False
variable_takingframe = False
variable_park = {'enable': False,
	'pos'   : 'center',
	'time'  : 0.1,
	'custom': {'x': 0, 'y': 0, 'dz': 0},
	'coord' : {'x': 0, 'y': 0, 'dz': 0}}
variable_extruder = {'fw_retract': False,
	'retract': 1.0,
	'extrude': 1.0}
variable_speed = {'travel': 100,
	'retract': 15,
	'extrude': 15}
variable_verbose = True
variable_check_time = 0.5
variable_restore = {'absolute': {'coordinates': True, 'extrude': True}, 'speed': 1500, 'e':0, 'factor': {'speed': 1.0, 'extrude': 1.0}}
variable_macro = {'pause': 'PAUSE', 'resume': 'RESUME'}
variable_is_paused = False
gcode = 
	{% set hyperlapse = True if params.HYPERLAPSE and params.HYPERLAPSE|lower =='true' else False %}
	{% if enable %}
	{% if (hyperlapse and printer['gcode_macro HYPERLAPSE'].run) or
	(not hyperlapse and not printer['gcode_macro HYPERLAPSE'].run) %}
	{% if park.enable %}
	{% set pos = {'x': 'X' + park.coord.x|string if park.pos != 'y_only' else '',
	'y': 'Y' + park.coord.y|string if park.pos != 'x_only' else '',
	'z': 'Z'+ [printer.gcode_move.gcode_position.z + park.coord.dz, printer.toolhead.axis_maximum.z]|min|string} %}
	{% set restore = {'absolute': {'coordinates': printer.gcode_move.absolute_coordinates,
	'extrude'    : printer.gcode_move.absolute_extrude},
	'speed'   : printer.gcode_move.speed,
	'e'       : printer.gcode_move.gcode_position.e,
	'factor'  : {'speed'  : printer.gcode_move.speed_factor,
	'extrude': printer.gcode_move.extrude_factor}} %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=restore VALUE="{restore}"
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, minimum extruder temperature not reached!")}{% endif %}
	{% else %}
	{% if extruder.fw_retract %}
	G10
	{% else %}
	M83
	G0 E-{extruder.retract} F{speed.retract * 60}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=True
	{macro.pause}
	SET_GCODE_OFFSET X=0 Y=0
	G90
	{% if "xyz" not in printer.toolhead.homed_axes %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, axis not homed yet!")}{% endif %}
	{% else %}
	G0 {pos.x} {pos.y} {pos.z} F{speed.travel * 60}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=takingframe VALUE=True
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={check_time}
	M400
	{% endif %}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE={hyperlapse}
	{% endif %}
	{% else %}
	{% if verbose %}{action_respond_info("Timelapse: disabled, take frame ignored")}{% endif %}
	{% endif %}

[gcode_macro _TIMELAPSE_NEW_FRAME]
description = action call for timelapse shoot. must be a seperate macro
gcode = 
	{action_call_remote_method("timelapse_newframe",
	macropark=printer['gcode_macro TIMELAPSE_TAKE_FRAME'].park,
	hyperlapse=params.HYPERLAPSE)}

[delayed_gcode _WAIT_TIMELAPSE_TAKE_FRAME]
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set factor = {'speed': printer.gcode_move.speed_factor, 'extrude': printer.gcode_move.extrude_factor} %}
	{% if tl.takingframe %}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={tl.check_time}
	{% else %}
	{tl.macro.resume} VELOCITY={tl.speed.travel}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=False
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{action_respond_info("Timelapse: Warning minimum extruder temperature not reached!")}
	{% else %}
	{% if tl.extruder.fw_retract %}
	G11
	{% else %}
	G0 E{tl.extruder.extrude} F{tl.speed.extrude * 60}
	G0 F{tl.restore.speed}
	{% if tl.restore.absolute.extrude %}
	M82
	G92 E{tl.restore.e}
	{% endif %}
	{% endif %}
	{% endif %}
	{% if tl.restore.factor.speed   != factor.speed   %} M220 S{(factor.speed*100)|round(0)}   {% endif %}
	{% if tl.restore.factor.extrude != factor.extrude %} M221 S{(factor.extrude*100)|round(0)} {% endif %}
	{% if not tl.restore.absolute.coordinates %} G91 {% endif %}
	{% endif %}

[gcode_macro HYPERLAPSE]
description = Start/Stop a hyperlapse recording
variable_cycle = 0
variable_run = False
gcode = 
	{% set cycle = params.CYCLE|default(30)|int %}
	{% if params.ACTION and params.ACTION|lower == 'start' %}
	{action_respond_info("Hyperlapse: frames started (Cycle %d sec)" % cycle)}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=True
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=cycle VALUE={cycle}
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True
	{% elif params.ACTION and params.ACTION|lower == 'stop' %}
	{% if run %}{action_respond_info("Hyperlapse: frames stopped")}{% endif %}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=False
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION=0
	{% else %}
	{action_raise_error("Hyperlapse: No valid input parameter
	Use:
	- HYPERLAPSE ACTION=START [CYCLE=time]
	- HYPERLAPSE ACTION=STOP")}
	{% endif %}

[delayed_gcode _HYPERLAPSE_LOOP]
gcode = 
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={printer["gcode_macro HYPERLAPSE"].cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True

[gcode_macro TIMELAPSE_RENDER]
description = Render Timelapse video and wait for the result
variable_render = False
variable_run_identifier = 0
gcode = 
	{action_respond_info("Timelapse: Rendering started")}
	{action_call_remote_method("timelapse_render", byrendermacro="True")}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=render VALUE=True
	{printer.configfile.settings['gcode_macro pause'].rename_existing}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5

[delayed_gcode _WAIT_TIMELAPSE_RENDER]
gcode = 
	{% set ri = printer['gcode_macro TIMELAPSE_RENDER'].run_identifier % 4 %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=run_identifier VALUE={ri + 1}
	{% if printer['gcode_macro TIMELAPSE_RENDER'].render %}
	M117 Rendering {['-','\\\\','|','/'][ri]}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5
	{% else %}
	{action_respond_info("Timelapse: Rendering finished")}
	M117
	{printer.configfile.settings['gcode_macro resume'].rename_existing}
	{% endif %}

[gcode_macro TEST_STREAM_DELAY]
description = Helper macro to find stream and park delay
gcode = 
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set act = printer.toolhead.position %}
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% if act.z > 5.0 %}
	G0 X{min.x + 5.0} F{tl.speed.travel|int * 60}
	G0 X{(max.x-min.x)/2}
	G4 P{tl.park.time|float * 1000}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE=FALSE
	G0 X{max.x - 5.0}
	{% else %}
	{action_raise_error("Toolhead z %.3f to low. Please place head above z = 5.0" % act.z)}
	{% endif %}

[gcode_macro PIDcalibrate]
gcode = 
	PID_CALIBRATE HEATER=extruder TARGET=235
	PID_CALIBRATE HEATER=heater_bed TARGET=80

[gcode_macro POWER_OFF_PRINTER]
gcode = 
	{action_call_remote_method( "set_device_power", device="printer_plug", state="off")}

[gcode_macro START_PRINT]
gcode = 
	{% set BED_TEMP = params.BED_TEMP|default(60)|float %}
	
	{% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(190)|float %}
	
	M140 S{BED_TEMP}
	
	G90
	
	G28
	
	G1 Z5 F3000
	BED_MESH_PROFILE LOAD=default
	
	M190 S{BED_TEMP}
	
	M109 S{EXTRUDER_TEMP}
	M117 Purge extruder
	G1 X25 Y20 Z0.3 F5000.0
	G1 X25 Y175.0 Z0.3 F1500.0 E15
	G1 X25 Y175.0 Z0.4 F5000.0
	G1 X25 Y20 Z0.4 F1500.0 E30
	G92 E0
	G1 Z1.0 F3000

[gcode_macro END_PRINT]
gcode = 
	
	M140 S0
	M104 S0
	
	M106 S0
	
	G91
	G1 X-2 Y-2 E-3 F300
	
	G1 Z10 F3000
	G90
	
	M84
	BED_MESH_CLEAR

[gcode_macro CALCULATE_BED_MESH]
description = Calculate bed_mesh boundaries automatically based on your bltouch/probe config
gcode = 
	{% set BED_MESH_MARGIN = params.BED_MESH_MARGIN|default(10)|float %}
	
	{% set X_MAX = printer.toolhead.axis_maximum.x|default(230)|float %}
	{% set Y_MAX = printer.toolhead.axis_maximum.y|default(230)|float %}
	
	{% set X_OFFSET = 0.0 |float %}
	{% set Y_OFFSET = 0.0 |float %}
	
	{% if printer.configfile.config["bltouch"] is defined %}
	{% set X_OFFSET = (printer.configfile.settings.bltouch.x_offset if printer.configfile.settings.bltouch.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.settings.bltouch.y_offset if printer.configfile.settings.bltouch.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	{% if printer.configfile.config["probe"] is defined %}
	{% set X_OFFSET = (printer.configfile.config.probe.x_offset if printer.configfile.config.probe.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.config.probe.y_offset if printer.configfile.config.probe.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	
	
	
	{% set BED_MESH_MIN_X = BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MIN_Y = BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_X = X_MAX - (X_OFFSET)|abs - BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_MAX - BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_Y = Y_MAX - (Y_OFFSET)|abs - BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_MAX - BED_MESH_MARGIN |float %}
	
	
	{action_respond_info("BED_MESH_MARGIN : %f" % (BED_MESH_MARGIN))}
	{action_respond_info("X_MAX           : %f" % (X_MAX))}
	{action_respond_info("Y_MAX           : %f" % (Y_MAX))}
	{action_respond_info("X_OFFSET        : %f" % (X_OFFSET))}
	{action_respond_info("Y_OFFSET        : %f" % (Y_OFFSET))}
	{action_respond_info("BED_MESH_MIN_X  : %f" % (BED_MESH_MIN_X))}
	{action_respond_info("BED_MESH_MIN_Y  : %f" % (BED_MESH_MIN_Y))}
	{action_respond_info("BED_MESH_MAX_X  : %f" % (BED_MESH_MAX_X))}
	{action_respond_info("BED_MESH_MAX_Y  : %f" % (BED_MESH_MAX_Y))}
	{action_respond_info("--- VALUES TO ADD OR UPDATE TO OUR BED_MESH VALUES ---")}
	{action_respond_info("--- VALORES PARA AGREGAR O ACTUALIZAR EN NUESTRA SECCIÓN BED_MESH ---")}
	{action_respond_info("mesh_max: %s,%s" % (BED_MESH_MAX_X,BED_MESH_MAX_Y))}
	{action_respond_info("mesh_min: %s,%s" % (BED_MESH_MIN_X,BED_MESH_MIN_Y))}

[gcode_macro PID_EXTRUDER]
description = PID Tune for the Extruder
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set T = params.TEMPERATURE|default(210)|float %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set P = printer.configfile.config[e].pid_kp|float %}
	{% set I = printer.configfile.config[e].pid_ki|float %}
	{% set D = printer.configfile.config[e].pid_kd|float %}
	M118 Homing...
	G28
	M106 S{S}
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Extruder PID calibration...
	PID_CALIBRATE HEATER={e} TARGET={T}
	TURN_OFF_HEATERS
	M107
	SAVE_CONFIG

[gcode_macro PID_BED]
description = PID Tune for the Bed
gcode = 
	{% set T = params.TEMPERATURE|default(60)|float %}
	{% set P = printer.configfile.config['heater_bed'].pid_kp|float %}
	{% set I = printer.configfile.config['heater_bed'].pid_ki|float %}
	{% set D = printer.configfile.config['heater_bed'].pid_kd|float %}
	M118 Homing...
	G28
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={T}
	TURN_OFF_HEATERS
	SAVE_CONFIG

[gcode_macro PID_ALL]
description = Heater and Bed temperature calibration. Usage: PID_ALL [TE=temperature] [TB=temperature]\\n Calibra la temperatura del extrusor y la cama. Uso: PID_ALL [TE=temperatura] [TB=temperature]
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set TE = params.TE|default(195)|int %}
	{% set TB = params.TB|default(45)|int %}
	M118 Homing...
	G28
	M118 Extruder PID calibration...
	M106 S{S}
	PID_CALIBRATE HEATER={e} TARGET={TE}
	M107
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={TB}
	SAVE_CONFIG

[tmc2209 stepper_x]
uart_pin = PE6
run_current = 0.9
diag_pin = ^PA15
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_y]
uart_pin = PE3
run_current = 0.9
diag_pin = ^PD2
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_z]
uart_pin = PB7
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 stepper_z1]
uart_pin = PD4
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 extruder]
uart_pin = PB3
run_current = 0.842
diag_pin = 
stealthchop_threshold = 0

[mcu eddy]
serial = /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00
restart_method = command

[temperature_sensor btt_eddy_mcu]
sensor_type = temperature_mcu
sensor_mcu = eddy
min_temp = 10
max_temp = 100

[probe_eddy_current btt_eddy]
sensor_type = ldc1612
z_offset = 2.5
i2c_mcu = eddy
i2c_bus = i2c0f
x_offset = -30
y_offset = 5
reg_drive_current = 16
calibrate = 
	0.050188:3205933.097,0.090337:3205145.727,0.130487:3204354.163,
	0.169383:3203615.123,0.209533:3202860.267,0.249683:3202120.825,
	0.289833:3201389.932,0.329983:3200675.781,0.370133:3199937.342,
	0.410283:3199271.075,0.450433:3198562.823,0.490583:3197906.664,
	0.529478:3197264.891,0.569628:3196643.334,0.609778:3195982.110,
	0.649928:3195394.352,0.690078:3194737.336,0.730228:3194161.411,
	0.770378:3193564.178,0.810528:3192980.830,0.849423:3192409.769,
	0.889573:3191874.493,0.929723:3191327.866,0.969873:3190787.673,
	1.010023:3190232.313,1.050173:3189727.474,1.090323:3189210.067,
	1.130473:3188739.481,1.170623:3188237.257,1.209519:3187753.422,
	1.249669:3187291.436,1.289819:3186821.547,1.329969:3186360.473,
	1.370119:3185924.800,1.410269:3185491.381,1.450419:3185053.330,
	1.490569:3184594.190,1.529464:3184205.277,1.569614:3183785.498,
	1.609764:3183350.340,1.649914:3182966.762,1.690064:3182588.711,
	1.730214:3182190.755,1.770364:3181813.670,1.810514:3181420.036,
	1.849409:3181087.634,1.889559:3180703.858,1.929709:3180363.438,
	1.969859:3180003.082,2.010009:3179664.903,2.050159:3179332.781,
	2.090309:3178990.508,2.130459:3178673.256,2.170609:3178345.224,
	2.209505:3178050.416,2.249655:3177734.057,2.289805:3177419.463,
	2.329955:3177136.203,2.370105:3176837.527,2.410255:3176546.139,
	2.450405:3176268.706,2.490555:3175972.146,2.529450:3175723.811,
	2.569600:3175470.080,2.609750:3175223.081,2.649900:3174962.842,
	2.690050:3174704.198,2.730200:3174460.913,2.770350:3174228.920,
	2.810500:3173989.118,2.849395:3173761.350,2.889545:3173516.616,
	2.929695:3173309.604,2.969845:3173089.770,3.009995:3172877.982,
	3.050145:3172644.639,3.090295:3172452.377,3.130445:3172252.422,
	3.170595:3172031.650,3.209491:3171857.260,3.249641:3171650.997,
	3.289791:3171441.897,3.329941:3171248.522,3.370091:3171071.032,
	3.410241:3170902.167,3.450391:3170700.892,3.490541:3170509.888,
	3.529436:3170367.070,3.569586:3170188.460,3.609736:3170015.379,
	3.649886:3169825.355,3.690036:3169687.899,3.730186:3169514.422,
	3.770336:3169378.249,3.810486:3169199.096,3.849381:3169055.600,
	3.889531:3168906.908,3.929681:3168770.855,3.969831:3168587.431,
	4.009981:3168461.835,4.050131:3168313.942

[temperature_probe btt_eddy]
sensor_type = Generic 3950
sensor_pin = eddy:gpio26
horizontal_move_z = 2
calibration_temp = 29.941653
drift_calibration = 
	3322659.134314, -5564.540372, 60.398093
	3204466.582019, -381.239579, 3.440192
	3191594.449302, -119.470102, 1.125202
	3183159.664481, 17.721542, -0.153070
	3176791.037916, 107.407930, -0.957123
	3171474.720102, 190.159212, -1.751515
	3166582.715676, 281.955770, -2.675074
	3163316.106670, 318.670366, -2.988620
	3160957.710763, 338.412885, -3.164299
drift_calibration_min_temp = 33.83103284492943

[bed_mesh]
speed = 50
horizontal_move_z = 1
mesh_min = 50,60
mesh_max = 280, 310
probe_count = 9, 9
mesh_pps = 3, 3
algorithm = bicubic
bicubic_tension = 0.2

[safe_z_home]
home_xy_position = 204, 185
speed = 50
z_hop = 10
z_hop_speed = 10

[save_variables]
filename = ~/printer_data/config/variables.cfg

[force_move]
enable_force_move = True

[delayed_gcode RESTORE_PROBE_OFFSET]
initial_duration = 1.
gcode = 
	{% set svv = printer.save_variables.variables %}
	{% if not printer["gcode_macro SET_GCODE_OFFSET"].restored %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ svv.nvm_offset|default(0) }
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=restored VALUE=True
	{% endif %}

[gcode_macro G28]
rename_existing = G28.1
gcode = 
	
	G28.1 {rawparams}
	{% if not rawparams or (rawparams and 'Z' in rawparams) %}
	PROBE
	SET_Z_FROM_PROBE
	{% endif %}

[gcode_macro SET_Z_FROM_PROBE]
gcode = 
	{% set cf = printer.configfile.settings %}
	SET_GCODE_OFFSET_ORIG Z={printer.probe.last_z_result - cf['probe_eddy_current btt_eddy'].z_offset + printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset}
	G90
	G1 Z{cf.safe_z_home.z_hop}

[gcode_macro Z_OFFSET_APPLY_PROBE]
rename_existing = Z_OFFSET_APPLY_PROBE_ORIG
gcode = 
	SAVE_VARIABLE VARIABLE=nvm_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset }

[gcode_macro SET_GCODE_OFFSET]
rename_existing = SET_GCODE_OFFSET_ORIG
variable_restored = False
variable_runtime_offset = 0
gcode = 
	{% if params.Z_ADJUST %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset + params.Z_ADJUST|float }
	{% endif %}
	{% if params.Z %}
	{% set paramList = rawparams.split() %}
	{% for i in range(paramList|length) %}
	{% if paramList[i]=="Z=0" %}
	{% set temp=paramList.pop(i) %}
	{% set temp="Z_ADJUST=" + (-printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset)|string %}
	{% if paramList.append(temp) %}{% endif %}
	{% endif %}
	{% endfor %}
	{% set rawparams=paramList|join(' ') %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE=0
	{% endif %}
	SET_GCODE_OFFSET_ORIG { rawparams }

[gcode_macro PROBE_EDDY_CURRENT_CALIBRATE_AUTO]
gcode = 
	BED_MESH_CLEAR
	G28 X Y
	G90
	G1 X{ printer.toolhead.axis_maximum.x/2 } Y{ printer.toolhead.axis_maximum.y/2 } F6000
	{% if 'z' not in printer.toolhead.homed_axes %}
	SET_KINEMATIC_POSITION Z={ printer.toolhead.axis_maximum.z-1 }
	{% endif %}
	PROBE_EDDY_CURRENT_CALIBRATE {rawparams}

[mcu]
serial = /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00

[stepper_x]
step_pin = PC14
dir_pin = !PC13
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA14
position_endstop = 0
position_min = 0
position_max = 330
homing_speed = 50

[stepper_y]
step_pin = PE5
dir_pin = PE4
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA15
position_endstop = 0
position_min = 0
position_max = 320
homing_speed = 50

[stepper_z1]
step_pin = PE1
dir_pin = PE0
enable_pin = !PE2
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop

[stepper_z]
step_pin = PD6
dir_pin = PD5
enable_pin = !PD7
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop
position_max = 400
position_min = -5
homing_speed = 10

[screws_tilt_adjust]
screw1 = 204,185
screw1_name = Central screw
screw2 = 105,84
screw2_name = Front left screw
screw3 = 305,84
screw3_name = Rear left screw
screw4 = 305,284
screw4_name = Front right screw
screw5 = 105, 284
screw5_name = Rear right screw
horizontal_move_z = 10
speed = 100
screw_thread = CW-M3

[bed_screws]
screw1 = 50,70
screw2 = 250,70
screw3 = 250, 230
screw4 = 50, 230

[z_tilt]
z_positions = -60, 155
	330, 155
points = 70, 184
	300, 184
speed = 100
horizontal_move_z = 10
retries = 8
retry_tolerance = 0.005

[extruder]
step_pin = PB5
dir_pin = !PB4
enable_pin = !PB6
microsteps = 16
rotation_distance = 8.06
nozzle_diameter = 0.400
filament_diameter = 1.750
heater_pin = PB1
sensor_type = ATC Semitec 104GT-2
sensor_pin = PC1
max_extrude_only_distance = 100000
min_temp = 0
max_temp = 260
pressure_advance = 0.08
control = pid
pid_kp = 39.588
pid_ki = 7.762
pid_kd = 50.475

[heater_bed]
heater_pin = PB10
sensor_type = ATC Semitec 104NT-4-R025H42G
sensor_pin = PC0
min_temp = 0
max_temp = 130
control = pid
pid_kp = 57.129
pid_ki = 2.026
pid_kd = 402.756
x_count = 4
y_count = 4
mesh_x_pps = 2
mesh_y_pps = 2
algo = bicubic
tension = 0.2
min_x = 40.0
max_x = 256.0
min_y = 60.0
max_y = 279.98999999999995

[fan]
pin = PA2
max_power = 1.0
off_below = 0.1

[heater_fan hotend]
pin = PA0
heater = extruder
heater_temp = 50.0
fan_speed = 1.0
shutdown_speed = 1.0

[printer]
kinematics = cartesian
max_velocity = 250
max_accel = 4500
max_z_velocity = 25
max_z_accel = 100

[skew_correction]

[bed_mesh default]
version = 1
points = 
	0.077380, 0.111423, 0.114676, 0.156457, 0.174093, 0.168682, 0.150091, 0.125241, 0.144394
	0.019770, 0.035236, 0.040041, 0.064163, 0.097841, 0.072235, 0.036121, 0.038328, -0.022320
	-0.046588, -0.004041, -0.002183, 0.034924, 0.056260, 0.057109, 0.025641, -0.003699, 0.000421
	-0.014058, -0.015146, -0.014967, 0.007296, 0.033845, 0.025323, -0.004179, -0.028621, -0.045631
	-0.053217, -0.062006, -0.048567, -0.019670, -0.003835, 0.000873, -0.021848, -0.046722, -0.038119
	-0.082454, -0.064824, -0.071665, -0.049962, -0.027577, -0.036043, -0.056768, -0.072205, -0.063067
	0.026282, -0.006652, -0.015925, 0.013883, 0.040249, 0.050473, 0.018200, -0.017486, -0.044483
	0.006865, 0.029730, 0.028595, 0.044249, 0.088176, 0.080421, 0.046590, 0.046284, 0.075516
	0.059874, -0.031578, -0.021740, 0.006004, 0.063576, 0.092164, 0.028281, -0.012436, -0.035619
x_count = 9
y_count = 9
mesh_x_pps = 3
mesh_y_pps = 3
algo = bicubic
tension = 0.2
min_x = 50.0
max_x = 280.0
min_y = 60.0
max_y = 310.0

[skew_correction mi_skew]
xy_skew = -0.00679190845337054
xz_skew = 0.0
yz_skew = 0.0
=======================
temperature_probe btt_eddy: loaded temperature drift calibration. Min Temp: 33.83, Min Freq: 3156001.351363
y(x) = 60.398093x^2 - 5564.540372x + 3322659.134314
y(x) = 3.440192x^2 - 381.239579x + 3204466.582019
y(x) = 1.125202x^2 - 119.470102x + 3191594.449302
y(x) = -0.153070x^2 + 17.721542x + 3183159.664481
y(x) = -0.957123x^2 + 107.407930x + 3176791.037916
y(x) = -1.751515x^2 + 190.159212x + 3171474.720102
y(x) = -2.675074x^2 + 281.955770x + 3166582.715676
y(x) = -2.988620x^2 + 318.670366x + 3163316.106670
y(x) = -3.164299x^2 + 338.412885x + 3160957.710763
temperature_probe btt_eddy: registered drift compensation with probe [probe_eddy_current btt_eddy]
Extruder max_extrude_ratio=0.266081
mcu 'mcu': Starting serial connect
webhooks client 547616709648: New connection
webhooks client 547616709648: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
Loaded MCU 'mcu' 144 commands (v0.13.0-320-gc80324946 / gcc: (15:12.2.rel1-1) 12.2.1 20221205 binutils: (2.40-2+18+b1) 2.40)
MCU 'mcu' config: ADC_MAX=4095 BUS_PINS_i2c1=PB6,PB7 BUS_PINS_i2c1a=PB8,PB9 BUS_PINS_i2c2=PB10,PB11 BUS_PINS_i2c2_PF1_PF0=PF1,PF0 BUS_PINS_i2c2a=PH4,PH5 BUS_PINS_i2c3=PA8,PC9 BUS_PINS_i2c3a=PH7,PH8 BUS_PINS_sdio=PC12,PD2,PC8,PC9,PC10,PC11 BUS_PINS_spi1=PA6,PA7,PA5 BUS_PINS_spi1_PA6_PA7_PA5=PA6,PA7,PA5 BUS_PINS_spi1_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi1a=PB4,PB5,PB3 BUS_PINS_spi2=PB14,PB15,PB13 BUS_PINS_spi2_PB14_PB15_PB13=PB14,PB15,PB13 BUS_PINS_spi2_PC2_PC3_PB10=PC2,PC3,PB10 BUS_PINS_spi2_PI2_PI3_PI1=PI2,PI3,PI1 BUS_PINS_spi2a=PC2,PC3,PB10 BUS_PINS_spi2b=PI2,PI3,PI1 BUS_PINS_spi3=PB4,PB5,PB3 BUS_PINS_spi3_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi3_PC11_PC12_PC10=PC11,PC12,PC10 BUS_PINS_spi3a=PC11,PC12,PC10 CLOCK_FREQ=168000000 MCU=stm32f407xx PWM_MAX=257 RESERVE_PINS_USB=PA11,PA12 RESERVE_PINS_crystal=PH0,PH1 STATS_SUMSQ_BASE=256 STEPPER_OPTIMIZED_EDGE=21 STEPPER_STEP_BOTH_EDGE=1
mcu 'eddy': Starting serial connect
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
MCU error during connect
Traceback (most recent call last):
  File "/home/luis/klipper/klippy/mcu.py", line 772, in _attach
    self._serial.connect_uart(self._serialport, self._baud, rts)
  File "/home/luis/klipper/klippy/serialhdl.py", line 191, in connect_uart
    self._error("Unable to connect")
  File "/home/luis/klipper/klippy/serialhdl.py", line 68, in _error
    raise error(self.warn_prefix + (msg % params))
serialhdl.error: mcu 'eddy': Unable to connect

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/luis/klipper/klippy/klippy.py", line 131, in _connect
    self.send_event("klippy:mcu_identify")
  File "/home/luis/klipper/klippy/klippy.py", line 223, in send_event
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klipper/klippy/klippy.py", line 223, in <listcomp>
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
            ^^^^^^^^^^^
  File "/home/luis/klipper/klippy/mcu.py", line 782, in _mcu_identify
    self._attach()
  File "/home/luis/klipper/klippy/mcu.py", line 777, in _attach
    raise error(str(e))
mcu.error: mcu 'eddy': Unable to connect
mcu 'eddy': Unable to connect
Once the underlying issue is corrected, use the
"FIRMWARE_RESTART" command to reset the firmware, reload the
config, and restart the host software.
Error configuring printer

Build file /home/luis/klipper/klippy/../.config(2653): Thu Jan  8 15:50:35 2026
========= Last MCU build config =========
CONFIG_LOW_LEVEL_OPTIONS=y
# CONFIG_MACH_AVR is not set
# CONFIG_MACH_ATSAM is not set
# CONFIG_MACH_ATSAMD is not set
# CONFIG_MACH_LPC176X is not set
# CONFIG_MACH_STM32 is not set
# CONFIG_MACH_HC32F460 is not set
CONFIG_MACH_RPXXXX=y
# CONFIG_MACH_PRU is not set
# CONFIG_MACH_AR100 is not set
# CONFIG_MACH_LINUX is not set
# CONFIG_MACH_SIMU is not set
CONFIG_BOARD_DIRECTORY="rp2040"
CONFIG_MCU="rp2040"
CONFIG_CLOCK_FREQ=12000000
CONFIG_USBSERIAL=y
CONFIG_FLASH_SIZE=0x200000
CONFIG_FLASH_BOOT_ADDRESS=0x10000100
CONFIG_RAM_START=0x20000000
CONFIG_RAM_SIZE=0x42000
CONFIG_STACK_SIZE=512
CONFIG_FLASH_APPLICATION_ADDRESS=0x10000100
CONFIG_RPXXXX_SELECT=y
CONFIG_MACH_RP2040=y
# CONFIG_MACH_RP2350 is not set
CONFIG_RP2040_HAVE_STAGE2=y
CONFIG_RPXXXX_FLASH_START_0100=y
# CONFIG_RPXXXX_FLASH_START_4000 is not set
CONFIG_RP2040_FLASH_W25Q080=y
# CONFIG_RP2040_FLASH_GENERIC_03 is not set
CONFIG_RP2040_STAGE2_FILE="boot2_w25q080.S"
CONFIG_RP2040_STAGE2_CLKDIV=2
CONFIG_RPXXXX_USB=y
# CONFIG_RPXXXX_SERIAL_UART0_PINS_0_1 is not set
# CONFIG_RPXXXX_SERIAL_UART0_PINS_12_13 is not set
# CONFIG_RPXXXX_SERIAL_UART0_PINS_16_17 is not set
# CONFIG_RPXXXX_SERIAL_UART0_PINS_28_29 is not set
# CONFIG_RPXXXX_SERIAL_UART1_PINS_4_5 is not set
# CONFIG_RPXXXX_SERIAL_UART1_PINS_8_9 is not set
# CONFIG_RPXXXX_SERIAL_UART1_PINS_20_21 is not set
# CONFIG_RPXXXX_SERIAL_UART1_PINS_24_25 is not set
# CONFIG_RPXXXX_CANBUS is not set
# CONFIG_RPXXXX_USBCANBUS is not set
CONFIG_RPXXXX_CANBUS_GPIO_RX=4
CONFIG_RPXXXX_CANBUS_GPIO_TX=5
CONFIG_USB=y
CONFIG_USB_VENDOR_ID=0x1d50
CONFIG_USB_DEVICE_ID=0x614e
CONFIG_USB_SERIAL_NUMBER_CHIPID=y
CONFIG_USB_SERIAL_NUMBER="12345"

#
# USB ids
#
# end of USB ids

CONFIG_WANT_ADC=y
CONFIG_WANT_SPI=y
CONFIG_WANT_SOFTWARE_SPI=y
CONFIG_WANT_I2C=y
CONFIG_WANT_SOFTWARE_I2C=y
CONFIG_WANT_HARD_PWM=y
CONFIG_WANT_BUTTONS=y
CONFIG_WANT_TMCUART=y
CONFIG_WANT_NEOPIXEL=y
CONFIG_WANT_PULSE_COUNTER=y
CONFIG_WANT_ST7920=y
CONFIG_WANT_HD44780=y
CONFIG_WANT_ADXL345=y
CONFIG_WANT_LIS2DW=y
CONFIG_WANT_MPU9250=y
CONFIG_WANT_ICM20948=y
CONFIG_WANT_THERMOCOUPLE=y
CONFIG_WANT_HX71X=y
CONFIG_WANT_ADS1220=y
CONFIG_WANT_LDC1612=y
CONFIG_WANT_SENSOR_ANGLE=y
CONFIG_NEED_SENSOR_BULK=y
CONFIG_WANT_LOAD_CELL_PROBE=y
CONFIG_NEED_SOS_FILTER=y
CONFIG_CANBUS_FREQUENCY=1000000
CONFIG_INLINE_STEPPER_HACK=y
CONFIG_HAVE_STEPPER_OPTIMIZED_BOTH_EDGE=y
CONFIG_WANT_STEPPER_OPTIMIZED_BOTH_EDGE=y
CONFIG_INITIAL_PINS=""
CONFIG_HAVE_GPIO=y
CONFIG_HAVE_GPIO_ADC=y
CONFIG_HAVE_GPIO_SPI=y
CONFIG_HAVE_GPIO_I2C=y
CONFIG_HAVE_GPIO_HARD_PWM=y
CONFIG_HAVE_STRICT_TIMING=y
CONFIG_HAVE_CHIPID=y
CONFIG_HAVE_BOOTLOADER_REQUEST=y
CONFIG_HAVE_SOFTWARE_DIVIDE_REQUIRED=y
=======================
No build file /home/luis/klipper/klippy/../out/klipper.dict
No build file /home/luis/klipper/klippy/../out/klipper.elf
Attempting MCU 'mcu' reset command
Unable to issue reset command on MCU 'eddy'
webhooks client 547616709648: Disconnected
Restarting printer
Start printer at Thu Jan  8 16:02:33 2026 (1767888153.2 334.8)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if lastStarting Klippy...
Args: ['/home/luis/klipper/klippy/klippy.py', '/home/luis/printer_data/config/printer.cfg', '-l', '/home/luis/printer_data/logs/klippy.log', '-I', '/home/luis/printer_data/comms/klippy.serial', '-a', '/home/luis/printer_data/comms/klippy.sock']
Git version: 'v0.13.0-320-gc80324946'
Branch: master
Remote: origin
Tracked URL: https://github.com/Klipper3d/klipper.git
CPU: 4 core ?
Device: Raspberry Pi 3 Model B Plus Rev 1.3
Linux: Linux version 6.12.47+rpt-rpi-v8 (serge@raspberrypi.com) (aarch64-linux-gnu-gcc-12 (Debian 12.2.0-14+deb12u1) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT Debian 1:6.12.47-1+rpt1~bookworm (2025-09-16)
Python: '3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]'
Start printer at Thu Jan  8 16:02:30 2026 (1767888150.2 35.4)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if last_extruder_temp.restore %}
	
	RESPOND TYPE=echo MSG='{"Restoring \\"%s\\" temperature to %3.1f\\u00B0C, this may take some time" % (printer.toolhead.extruder, last_extruder_temp.temp) }'
	M109 S{last_extruder_temp.temp}
	{% set do_resume = True %}
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	{% if runout_resume %}
	{% if do_resume %}
	{% if restore_idle_timeout > 0 %} SET_IDLE_TIMEOUT TIMEOUT={restore_idle_timeout} {% endif %}
	{client.user_resume_macro|default("")}
	_CLIENT_EXTRUDE
	RESUME_BASE VELOCITY={params.VELOCITY|default(sp_move)}
	{% endif %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]}'
	{% set _d = prompt_txt.append("\\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]) %}
	{% endif %}
	
	{% if not (runout_resume and do_resume) %}
	RESPOND TYPE=command MSG="action:prompt_begin RESUME aborted !!!"
	{% for element in prompt_txt %}
	RESPOND TYPE=command MSG='{"action:prompt_text %s" % element}'
	{% endfor %}
	RESPOND TYPE=command MSG="action:prompt_footer_button Ok|RESPOND TYPE=command MSG=action:prompt_end|info"
	RESPOND TYPE=command MSG="action:prompt_show"
	{% endif %}

[gcode_macro SET_PAUSE_NEXT_LAYER]
description = Enable a pause if the next layer is reached
gcode = 
	{% set pause_next_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_next_layer %}
	{% set ENABLE = params.ENABLE|default(1)|int != 0 %}
	{% set MACRO = params.MACRO|default(pause_next_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_next_layer VALUE="{{ 'enable': ENABLE, 'call': MACRO }}"

[gcode_macro SET_PAUSE_AT_LAYER]
description = Enable/disable a pause if a given layer number is reached
gcode = 
	{% set pause_at_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_at_layer %}
	{% set ENABLE = params.ENABLE|int != 0 if params.ENABLE is defined
	else params.LAYER is defined %}
	{% set LAYER = params.LAYER|default(pause_at_layer.layer)|int %}
	{% set MACRO = params.MACRO|default(pause_at_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_at_layer VALUE="{{ 'enable': ENABLE, 'layer': LAYER, 'call': MACRO }}"

[gcode_macro SET_PRINT_STATS_INFO]
rename_existing = SET_PRINT_STATS_INFO_BASE
description = Overwrite, to get pause_next_layer and pause_at_layer feature
variable_pause_next_layer = { 'enable': False, 'call': "PAUSE" }
variable_pause_at_layer = { 'enable': False, 'layer': 0, 'call': "PAUSE" }
gcode = 
	{% if pause_next_layer.enable %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_next_layer" % pause_next_layer.call}'
	{pause_next_layer.call}
	SET_PAUSE_NEXT_LAYER ENABLE=0
	{% elif pause_at_layer.enable and params.CURRENT_LAYER is defined and params.CURRENT_LAYER|int == pause_at_layer.layer %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_at_layer [%d]" % (pause_at_layer.call, pause_at_layer.layer)}'
	{pause_at_layer.call}
	SET_PAUSE_AT_LAYER ENABLE=0
	{% endif %}
	SET_PRINT_STATS_INFO_BASE {rawparams}

[gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL]
description = Helper: park toolhead used in PAUSE and CANCEL_PRINT
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set use_custom     = client.use_custom_pos|default(false)|lower == 'true' %}
	{% set custom_park_x  = client.custom_park_x|default(0.0) %}
	{% set custom_park_y  = client.custom_park_y|default(0.0) %}
	{% set park_dz        = client.custom_park_dz|default(2.0)|abs %}
	{% set sp_hop         = client.speed_hop|default(15) * 60 %}
	{% set sp_move        = client.speed_move|default(velocity) * 60 %}
	
	{% set origin    = printer.gcode_move.homing_origin %}
	{% set act       = printer.gcode_move.gcode_position %}
	{% set max       = printer.toolhead.axis_maximum %}
	{% set cone      = printer.toolhead.cone_start_z|default(max.z) %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	
	{% set z_min = params.Z_MIN|default(0)|float %}
	{% set z_park = [[(act.z + park_dz), z_min]|max, (max.z - origin.z)]|min %}
	{% set x_park = params.X       if params.X is defined
	else custom_park_x  if use_custom
	else 0.0            if round_bed
	else (max.x - 5.0) %}
	{% set y_park = params.Y       if params.Y is defined
	else custom_park_y  if use_custom
	else (max.y - 5.0)  if round_bed and z_park < cone
	else 0.0            if round_bed
	else (max.y - 5.0) %}
	
	_CLIENT_RETRACT
	{% if "xyz" in printer.toolhead.homed_axes %}
	G90
	G1 Z{z_park} F{sp_hop}
	G1 X{x_park} Y{y_park} F{sp_move}
	{% if not printer.gcode_move.absolute_coordinates %} G91 {% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='Printer not homed'
	{% endif %}

[gcode_macro _CLIENT_EXTRUDE]
description = Extrudes, if the extruder is hot enough
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set use_fw_retract = (client.use_fw_retract|default(false)|lower == 'true') and (printer.firmware_retraction is defined) %}
	{% set length = params.LENGTH|default(client.unretract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_unretract)|default(35) %}
	{% set absolute_extrude = printer.gcode_move.absolute_extrude %}
	
	{% if printer.toolhead.extruder != '' %}
	{% if printer[printer.toolhead.extruder].can_extrude %}
	{% if use_fw_retract %}
	{% if length < 0 %}
	G10
	{% else %}
	G11
	{% endif %}
	{% else %}
	M83
	G1 E{length} F{(speed|float|abs) * 60}
	{% if absolute_extrude %}
	M82
	{% endif %}
	{% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='{"\\"%s\\" not hot enough" % printer.toolhead.extruder}'
	{% endif %}
	{% endif %}

[gcode_macro _CLIENT_RETRACT]
description = Retracts, if the extruder is hot enough
gcode = 
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set length = params.LENGTH|default(client.retract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_retract)|default(35) %}
	
	_CLIENT_EXTRUDE LENGTH=-{length|float|abs} SPEED={speed|float|abs}

[gcode_macro _CLIENT_LINEAR_MOVE]
description = Linear move with save and restore of the gcode state
gcode = 
	{% set x_move = "X" ~ params.X if params.X is defined else "" %}
	{% set y_move = "Y" ~ params.Y if params.Y is defined else "" %}
	{% set z_move = "Z" ~ params.Z if params.Z is defined else "" %}
	{% set e_move = "E" ~ params.E if params.E is defined else "" %}
	{% set rate = "F" ~ params.F if params.F is defined else "" %}
	{% set ABSOLUTE = params.ABSOLUTE | default(0) | int != 0 %}
	{% set ABSOLUTE_E = params.ABSOLUTE_E | default(0) | int != 0 %}
	SAVE_GCODE_STATE NAME=_client_movement
	{% if x_move or y_move or z_move %}
	G9{ 0 if ABSOLUTE else 1 }
	{% endif %}
	{% if e_move %}
	M8{ 2 if ABSOLUTE_E else 3 }
	{% endif %}
	G1 { x_move } { y_move } { z_move } { e_move } { rate }
	RESTORE_GCODE_STATE NAME=_client_movement

[gcode_macro GET_TIMELAPSE_SETUP]
description = Print the Timelapse setup
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set output_txt = ["Timelapse Setup:"] %}
	{% set _dummy = output_txt.append("enable: %s" % tl.enable) %}
	{% set _dummy = output_txt.append("park: %s" % tl.park.enable) %}
	{% if tl.park.enable %}
	{% set _dummy = output_txt.append("park position: %s time: %s s" % (tl.park.pos, tl.park.time)) %}
	{% set _dummy = output_txt.append("park cord x:%s y:%s dz:%s" % (tl.park.coord.x, tl.park.coord.y, tl.park.coord.dz)) %}
	{% set _dummy = output_txt.append("travel speed: %s mm/s" % tl.speed.travel) %}
	{% endif %}
	{% set _dummy = output_txt.append("fw_retract: %s" % tl.extruder.fw_retract) %}
	{% if not tl.extruder.fw_retract %}
	{% set _dummy = output_txt.append("retract: %s mm speed: %s mm/s" % (tl.extruder.retract, tl.speed.retract)) %}
	{% set _dummy = output_txt.append("extrude: %s mm speed: %s mm/s" % (tl.extruder.extrude, tl.speed.extrude)) %}
	{% endif %}
	{% set _dummy = output_txt.append("verbose: %s" % tl.verbose) %}
	{action_respond_info(output_txt|join("\\n"))}

[gcode_macro _SET_TIMELAPSE_SETUP]
description = Set user parameters for timelapse
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	{% set park = {'min'   : {'x': (min.x / 1.42)|round(3) if round_bed else min.x|round(3),
	'y': (min.y / 1.42)|round(3) if round_bed else min.y|round(3)},
	'max'   : {'x': (max.x / 1.42)|round(3) if round_bed else max.x|round(3),
	'y': (max.y / 1.42)|round(3) if round_bed else max.y|round(3)},
	'center': {'x': (max.x-(max.x-min.x)/2)|round(3),
	'y': (max.y-(max.y-min.y)/2)|round(3)}} %}
	
	{% if params.ENABLE %}
	{% if params.ENABLE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=enable VALUE={True if params.ENABLE|lower == 'true' else False}
	{% else %}
	{action_raise_error("ENABLE=%s not supported. Allowed values are [True, False]" % params.ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.VERBOSE %}
	{% if params.VERBOSE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=verbose VALUE={True if params.VERBOSE|lower == 'true' else False}
	{% else %}
	{action_raise_error("VERBOSE=%s not supported. Allowed values are [True, False]" % params.VERBOSE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_X %}
	{% if params.CUSTOM_POS_X|float >= min.x and params.CUSTOM_POS_X|float <= max.x %}
	{% set _dummy = tl.park.custom.update({'x':params.CUSTOM_POS_X|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_X=%s must be within [%s - %s]" % (params.CUSTOM_POS_X, min.x, max.x))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_Y %}
	{% if params.CUSTOM_POS_Y|float >= min.y and params.CUSTOM_POS_Y|float <= max.y %}
	{% set _dummy = tl.park.custom.update({'y':params.CUSTOM_POS_Y|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_Y=%s must be within [%s - %s]" % (params.CUSTOM_POS_Y, min.y, max.y))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_DZ %}
	{% if params.CUSTOM_POS_DZ|float >= min.z and params.CUSTOM_POS_DZ|float <= max.z %}
	{% set _dummy = tl.park.custom.update({'dz':params.CUSTOM_POS_DZ|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_DZ=%s must be within [%s - %s]" % (params.CUSTOM_POS_DZ, min.z, max.z))}
	{% endif %}
	{% endif %}
	{% if params.PARK_ENABLE %}
	{% if params.PARK_ENABLE|lower is in ['true', 'false'] %}
	{% set _dummy = tl.park.update({'enable':True if params.PARK_ENABLE|lower == 'true' else False}) %}
	{% else %}
	{action_raise_error("PARK_ENABLE=%s not supported. Allowed values are [True, False]" % params.PARK_ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.PARK_POS %}
	{% if params.PARK_POS|lower is in ['center','front_left','front_right','back_left','back_right','custom','x_only','y_only'] %}
	{% set dic = {'center'      : {'x': park.center.x   , 'y': park.center.y   , 'dz': 1                },
	'front_left'  : {'x': park.min.x      , 'y': park.min.y      , 'dz': 0                },
	'front_right' : {'x': park.max.x      , 'y': park.min.y      , 'dz': 0                },
	'back_left'   : {'x': park.min.x      , 'y': park.max.y      , 'dz': 0                },
	'back_right'  : {'x': park.max.x      , 'y': park.max.y      , 'dz': 0                },
	'custom'      : {'x': tl.park.custom.x, 'y': tl.park.custom.y, 'dz': tl.park.custom.dz},
	'x_only'      : {'x': tl.park.custom.x, 'y': 'none'          , 'dz': tl.park.custom.dz},
	'y_only'      : {'x': 'none'          , 'y': tl.park.custom.y, 'dz': tl.park.custom.dz}} %}
	{% set _dummy = tl.park.update({'pos':params.PARK_POS|lower}) %}
	{% set _dummy = tl.park.update({'coord':dic[tl.park.pos]}) %}
	{% else %}
	{action_raise_error("PARK_POS=%s not supported. Allowed values are [CENTER, FRONT_LEFT, FRONT_RIGHT, BACK_LEFT, BACK_RIGHT, CUSTOM, X_ONLY, Y_ONLY]"
	% params.PARK_POS|upper)}
	{% endif %}
	{% endif %}
	{% if params.PARK_TIME %}
	{% if params.PARK_TIME|float >= 0.0 %}
	{% set _dummy = tl.park.update({'time':params.PARK_TIME|float|round(3)}) %}
	{% else %}
	{action_raise_error("PARK_TIME=%s must be a positive number" % params.PARK_TIME)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=park VALUE="{tl.park}"
	{% if params.TRAVEL_SPEED %}
	{% if params.TRAVEL_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'travel':params.TRAVEL_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("TRAVEL_SPEED=%s must be larger than 0" % params.TRAVEL_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_SPEED %}
	{% if params.RETRACT_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'retract':params.RETRACT_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_SPEED=%s must be larger than 0" % params.RETRACT_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.EXTRUDE_SPEED %}
	{% if params.EXTRUDE_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'extrude':params.EXTRUDE_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_SPEED=%s must be larger than 0" % params.EXTRUDE_SPEED)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=speed VALUE="{tl.speed}"
	{% if params.EXTRUDE_DISTANCE %}
	{% if params.EXTRUDE_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'extrude':params.EXTRUDE_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_DISTANCE=%s must be specified as positiv number" % params.EXTRUDE_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_DISTANCE %}
	{% if params.RETRACT_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'retract':params.RETRACT_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_DISTANCE=%s must be specified as positiv number" % params.RETRACT_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.FW_RETRACT %}
	{% if params.FW_RETRACT|lower is in ['true', 'false'] %}
	{% if 'firmware_retraction' in printer.configfile.settings %}
	{% set _dummy = tl.extruder.update({'fw_retract': True if params.FW_RETRACT|lower == 'true' else False}) %}
	{% else %}
	{% set _dummy = tl.extruder.update({'fw_retract':False}) %}
	{% if params.FW_RETRACT|capitalize == 'True' %}
	{action_raise_error("[firmware_retraction] not defined in printer.cfg. Can not enable fw_retract")}
	{% endif %}
	{% endif %}
	{% else %}
	{action_raise_error("FW_RETRACT=%s not supported. Allowed values are [True, False]" % params.FW_RETRACT|capitalize)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=extruder VALUE="{tl.extruder}"
	{% if printer.configfile.settings['gcode_macro pause'] is defined %}
	{% set _dummy = tl.macro.update({'pause': printer.configfile.settings['gcode_macro pause'].rename_existing}) %}
	{% endif %}
	{% if printer.configfile.settings['gcode_macro resume'] is defined %}
	{% set _dummy = tl.macro.update({'resume': printer.configfile.settings['gcode_macro resume'].rename_existing}) %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=macro VALUE="{tl.macro}"

[gcode_macro TIMELAPSE_TAKE_FRAME]
description = Take Timelapse shoot
variable_enable = False
variable_takingframe = False
variable_park = {'enable': False,
	'pos'   : 'center',
	'time'  : 0.1,
	'custom': {'x': 0, 'y': 0, 'dz': 0},
	'coord' : {'x': 0, 'y': 0, 'dz': 0}}
variable_extruder = {'fw_retract': False,
	'retract': 1.0,
	'extrude': 1.0}
variable_speed = {'travel': 100,
	'retract': 15,
	'extrude': 15}
variable_verbose = True
variable_check_time = 0.5
variable_restore = {'absolute': {'coordinates': True, 'extrude': True}, 'speed': 1500, 'e':0, 'factor': {'speed': 1.0, 'extrude': 1.0}}
variable_macro = {'pause': 'PAUSE', 'resume': 'RESUME'}
variable_is_paused = False
gcode = 
	{% set hyperlapse = True if params.HYPERLAPSE and params.HYPERLAPSE|lower =='true' else False %}
	{% if enable %}
	{% if (hyperlapse and printer['gcode_macro HYPERLAPSE'].run) or
	(not hyperlapse and not printer['gcode_macro HYPERLAPSE'].run) %}
	{% if park.enable %}
	{% set pos = {'x': 'X' + park.coord.x|string if park.pos != 'y_only' else '',
	'y': 'Y' + park.coord.y|string if park.pos != 'x_only' else '',
	'z': 'Z'+ [printer.gcode_move.gcode_position.z + park.coord.dz, printer.toolhead.axis_maximum.z]|min|string} %}
	{% set restore = {'absolute': {'coordinates': printer.gcode_move.absolute_coordinates,
	'extrude'    : printer.gcode_move.absolute_extrude},
	'speed'   : printer.gcode_move.speed,
	'e'       : printer.gcode_move.gcode_position.e,
	'factor'  : {'speed'  : printer.gcode_move.speed_factor,
	'extrude': printer.gcode_move.extrude_factor}} %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=restore VALUE="{restore}"
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, minimum extruder temperature not reached!")}{% endif %}
	{% else %}
	{% if extruder.fw_retract %}
	G10
	{% else %}
	M83
	G0 E-{extruder.retract} F{speed.retract * 60}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=True
	{macro.pause}
	SET_GCODE_OFFSET X=0 Y=0
	G90
	{% if "xyz" not in printer.toolhead.homed_axes %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, axis not homed yet!")}{% endif %}
	{% else %}
	G0 {pos.x} {pos.y} {pos.z} F{speed.travel * 60}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=takingframe VALUE=True
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={check_time}
	M400
	{% endif %}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE={hyperlapse}
	{% endif %}
	{% else %}
	{% if verbose %}{action_respond_info("Timelapse: disabled, take frame ignored")}{% endif %}
	{% endif %}

[gcode_macro _TIMELAPSE_NEW_FRAME]
description = action call for timelapse shoot. must be a seperate macro
gcode = 
	{action_call_remote_method("timelapse_newframe",
	macropark=printer['gcode_macro TIMELAPSE_TAKE_FRAME'].park,
	hyperlapse=params.HYPERLAPSE)}

[delayed_gcode _WAIT_TIMELAPSE_TAKE_FRAME]
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set factor = {'speed': printer.gcode_move.speed_factor, 'extrude': printer.gcode_move.extrude_factor} %}
	{% if tl.takingframe %}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={tl.check_time}
	{% else %}
	{tl.macro.resume} VELOCITY={tl.speed.travel}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=False
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{action_respond_info("Timelapse: Warning minimum extruder temperature not reached!")}
	{% else %}
	{% if tl.extruder.fw_retract %}
	G11
	{% else %}
	G0 E{tl.extruder.extrude} F{tl.speed.extrude * 60}
	G0 F{tl.restore.speed}
	{% if tl.restore.absolute.extrude %}
	M82
	G92 E{tl.restore.e}
	{% endif %}
	{% endif %}
	{% endif %}
	{% if tl.restore.factor.speed   != factor.speed   %} M220 S{(factor.speed*100)|round(0)}   {% endif %}
	{% if tl.restore.factor.extrude != factor.extrude %} M221 S{(factor.extrude*100)|round(0)} {% endif %}
	{% if not tl.restore.absolute.coordinates %} G91 {% endif %}
	{% endif %}

[gcode_macro HYPERLAPSE]
description = Start/Stop a hyperlapse recording
variable_cycle = 0
variable_run = False
gcode = 
	{% set cycle = params.CYCLE|default(30)|int %}
	{% if params.ACTION and params.ACTION|lower == 'start' %}
	{action_respond_info("Hyperlapse: frames started (Cycle %d sec)" % cycle)}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=True
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=cycle VALUE={cycle}
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True
	{% elif params.ACTION and params.ACTION|lower == 'stop' %}
	{% if run %}{action_respond_info("Hyperlapse: frames stopped")}{% endif %}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=False
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION=0
	{% else %}
	{action_raise_error("Hyperlapse: No valid input parameter
	Use:
	- HYPERLAPSE ACTION=START [CYCLE=time]
	- HYPERLAPSE ACTION=STOP")}
	{% endif %}

[delayed_gcode _HYPERLAPSE_LOOP]
gcode = 
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={printer["gcode_macro HYPERLAPSE"].cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True

[gcode_macro TIMELAPSE_RENDER]
description = Render Timelapse video and wait for the result
variable_render = False
variable_run_identifier = 0
gcode = 
	{action_respond_info("Timelapse: Rendering started")}
	{action_call_remote_method("timelapse_render", byrendermacro="True")}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=render VALUE=True
	{printer.configfile.settings['gcode_macro pause'].rename_existing}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5

[delayed_gcode _WAIT_TIMELAPSE_RENDER]
gcode = 
	{% set ri = printer['gcode_macro TIMELAPSE_RENDER'].run_identifier % 4 %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=run_identifier VALUE={ri + 1}
	{% if printer['gcode_macro TIMELAPSE_RENDER'].render %}
	M117 Rendering {['-','\\\\','|','/'][ri]}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5
	{% else %}
	{action_respond_info("Timelapse: Rendering finished")}
	M117
	{printer.configfile.settings['gcode_macro resume'].rename_existing}
	{% endif %}

[gcode_macro TEST_STREAM_DELAY]
description = Helper macro to find stream and park delay
gcode = 
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set act = printer.toolhead.position %}
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% if act.z > 5.0 %}
	G0 X{min.x + 5.0} F{tl.speed.travel|int * 60}
	G0 X{(max.x-min.x)/2}
	G4 P{tl.park.time|float * 1000}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE=FALSE
	G0 X{max.x - 5.0}
	{% else %}
	{action_raise_error("Toolhead z %.3f to low. Please place head above z = 5.0" % act.z)}
	{% endif %}

[gcode_macro PIDcalibrate]
gcode = 
	PID_CALIBRATE HEATER=extruder TARGET=235
	PID_CALIBRATE HEATER=heater_bed TARGET=80

[gcode_macro POWER_OFF_PRINTER]
gcode = 
	{action_call_remote_method( "set_device_power", device="printer_plug", state="off")}

[gcode_macro START_PRINT]
gcode = 
	{% set BED_TEMP = params.BED_TEMP|default(60)|float %}
	
	{% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(190)|float %}
	
	M140 S{BED_TEMP}
	
	G90
	
	G28
	
	G1 Z5 F3000
	BED_MESH_PROFILE LOAD=default
	
	M190 S{BED_TEMP}
	
	M109 S{EXTRUDER_TEMP}
	M117 Purge extruder
	G1 X25 Y20 Z0.3 F5000.0
	G1 X25 Y175.0 Z0.3 F1500.0 E15
	G1 X25 Y175.0 Z0.4 F5000.0
	G1 X25 Y20 Z0.4 F1500.0 E30
	G92 E0
	G1 Z1.0 F3000

[gcode_macro END_PRINT]
gcode = 
	
	M140 S0
	M104 S0
	
	M106 S0
	
	G91
	G1 X-2 Y-2 E-3 F300
	
	G1 Z10 F3000
	G90
	
	M84
	BED_MESH_CLEAR

[gcode_macro CALCULATE_BED_MESH]
description = Calculate bed_mesh boundaries automatically based on your bltouch/probe config
gcode = 
	{% set BED_MESH_MARGIN = params.BED_MESH_MARGIN|default(10)|float %}
	
	{% set X_MAX = printer.toolhead.axis_maximum.x|default(230)|float %}
	{% set Y_MAX = printer.toolhead.axis_maximum.y|default(230)|float %}
	
	{% set X_OFFSET = 0.0 |float %}
	{% set Y_OFFSET = 0.0 |float %}
	
	{% if printer.configfile.config["bltouch"] is defined %}
	{% set X_OFFSET = (printer.configfile.settings.bltouch.x_offset if printer.configfile.settings.bltouch.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.settings.bltouch.y_offset if printer.configfile.settings.bltouch.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	{% if printer.configfile.config["probe"] is defined %}
	{% set X_OFFSET = (printer.configfile.config.probe.x_offset if printer.configfile.config.probe.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.config.probe.y_offset if printer.configfile.config.probe.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	
	
	
	{% set BED_MESH_MIN_X = BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MIN_Y = BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_X = X_MAX - (X_OFFSET)|abs - BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_MAX - BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_Y = Y_MAX - (Y_OFFSET)|abs - BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_MAX - BED_MESH_MARGIN |float %}
	
	
	{action_respond_info("BED_MESH_MARGIN : %f" % (BED_MESH_MARGIN))}
	{action_respond_info("X_MAX           : %f" % (X_MAX))}
	{action_respond_info("Y_MAX           : %f" % (Y_MAX))}
	{action_respond_info("X_OFFSET        : %f" % (X_OFFSET))}
	{action_respond_info("Y_OFFSET        : %f" % (Y_OFFSET))}
	{action_respond_info("BED_MESH_MIN_X  : %f" % (BED_MESH_MIN_X))}
	{action_respond_info("BED_MESH_MIN_Y  : %f" % (BED_MESH_MIN_Y))}
	{action_respond_info("BED_MESH_MAX_X  : %f" % (BED_MESH_MAX_X))}
	{action_respond_info("BED_MESH_MAX_Y  : %f" % (BED_MESH_MAX_Y))}
	{action_respond_info("--- VALUES TO ADD OR UPDATE TO OUR BED_MESH VALUES ---")}
	{action_respond_info("--- VALORES PARA AGREGAR O ACTUALIZAR EN NUESTRA SECCIÓN BED_MESH ---")}
	{action_respond_info("mesh_max: %s,%s" % (BED_MESH_MAX_X,BED_MESH_MAX_Y))}
	{action_respond_info("mesh_min: %s,%s" % (BED_MESH_MIN_X,BED_MESH_MIN_Y))}

[gcode_macro PID_EXTRUDER]
description = PID Tune for the Extruder
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set T = params.TEMPERATURE|default(210)|float %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set P = printer.configfile.config[e].pid_kp|float %}
	{% set I = printer.configfile.config[e].pid_ki|float %}
	{% set D = printer.configfile.config[e].pid_kd|float %}
	M118 Homing...
	G28
	M106 S{S}
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Extruder PID calibration...
	PID_CALIBRATE HEATER={e} TARGET={T}
	TURN_OFF_HEATERS
	M107
	SAVE_CONFIG

[gcode_macro PID_BED]
description = PID Tune for the Bed
gcode = 
	{% set T = params.TEMPERATURE|default(60)|float %}
	{% set P = printer.configfile.config['heater_bed'].pid_kp|float %}
	{% set I = printer.configfile.config['heater_bed'].pid_ki|float %}
	{% set D = printer.configfile.config['heater_bed'].pid_kd|float %}
	M118 Homing...
	G28
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={T}
	TURN_OFF_HEATERS
	SAVE_CONFIG

[gcode_macro PID_ALL]
description = Heater and Bed temperature calibration. Usage: PID_ALL [TE=temperature] [TB=temperature]\\n Calibra la temperatura del extrusor y la cama. Uso: PID_ALL [TE=temperatura] [TB=temperature]
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set TE = params.TE|default(195)|int %}
	{% set TB = params.TB|default(45)|int %}
	M118 Homing...
	G28
	M118 Extruder PID calibration...
	M106 S{S}
	PID_CALIBRATE HEATER={e} TARGET={TE}
	M107
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={TB}
	SAVE_CONFIG

[tmc2209 stepper_x]
uart_pin = PE6
run_current = 0.9
diag_pin = ^PA15
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_y]
uart_pin = PE3
run_current = 0.9
diag_pin = ^PD2
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_z]
uart_pin = PB7
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 stepper_z1]
uart_pin = PD4
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 extruder]
uart_pin = PB3
run_current = 0.842
diag_pin = 
stealthchop_threshold = 0

[mcu eddy]
serial = /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00
restart_method = command

[temperature_sensor btt_eddy_mcu]
sensor_type = temperature_mcu
sensor_mcu = eddy
min_temp = 10
max_temp = 100

[probe_eddy_current btt_eddy]
sensor_type = ldc1612
z_offset = 2.5
i2c_mcu = eddy
i2c_bus = i2c0f
x_offset = -30
y_offset = 5
reg_drive_current = 16
calibrate = 
	0.050188:3205933.097,0.090337:3205145.727,0.130487:3204354.163,
	0.169383:3203615.123,0.209533:3202860.267,0.249683:3202120.825,
	0.289833:3201389.932,0.329983:3200675.781,0.370133:3199937.342,
	0.410283:3199271.075,0.450433:3198562.823,0.490583:3197906.664,
	0.529478:3197264.891,0.569628:3196643.334,0.609778:3195982.110,
	0.649928:3195394.352,0.690078:3194737.336,0.730228:3194161.411,
	0.770378:3193564.178,0.810528:3192980.830,0.849423:3192409.769,
	0.889573:3191874.493,0.929723:3191327.866,0.969873:3190787.673,
	1.010023:3190232.313,1.050173:3189727.474,1.090323:3189210.067,
	1.130473:3188739.481,1.170623:3188237.257,1.209519:3187753.422,
	1.249669:3187291.436,1.289819:3186821.547,1.329969:3186360.473,
	1.370119:3185924.800,1.410269:3185491.381,1.450419:3185053.330,
	1.490569:3184594.190,1.529464:3184205.277,1.569614:3183785.498,
	1.609764:3183350.340,1.649914:3182966.762,1.690064:3182588.711,
	1.730214:3182190.755,1.770364:3181813.670,1.810514:3181420.036,
	1.849409:3181087.634,1.889559:3180703.858,1.929709:3180363.438,
	1.969859:3180003.082,2.010009:3179664.903,2.050159:3179332.781,
	2.090309:3178990.508,2.130459:3178673.256,2.170609:3178345.224,
	2.209505:3178050.416,2.249655:3177734.057,2.289805:3177419.463,
	2.329955:3177136.203,2.370105:3176837.527,2.410255:3176546.139,
	2.450405:3176268.706,2.490555:3175972.146,2.529450:3175723.811,
	2.569600:3175470.080,2.609750:3175223.081,2.649900:3174962.842,
	2.690050:3174704.198,2.730200:3174460.913,2.770350:3174228.920,
	2.810500:3173989.118,2.849395:3173761.350,2.889545:3173516.616,
	2.929695:3173309.604,2.969845:3173089.770,3.009995:3172877.982,
	3.050145:3172644.639,3.090295:3172452.377,3.130445:3172252.422,
	3.170595:3172031.650,3.209491:3171857.260,3.249641:3171650.997,
	3.289791:3171441.897,3.329941:3171248.522,3.370091:3171071.032,
	3.410241:3170902.167,3.450391:3170700.892,3.490541:3170509.888,
	3.529436:3170367.070,3.569586:3170188.460,3.609736:3170015.379,
	3.649886:3169825.355,3.690036:3169687.899,3.730186:3169514.422,
	3.770336:3169378.249,3.810486:3169199.096,3.849381:3169055.600,
	3.889531:3168906.908,3.929681:3168770.855,3.969831:3168587.431,
	4.009981:3168461.835,4.050131:3168313.942

[temperature_probe btt_eddy]
sensor_type = Generic 3950
sensor_pin = eddy:gpio26
horizontal_move_z = 2
calibration_temp = 29.941653
drift_calibration = 
	3322659.134314, -5564.540372, 60.398093
	3204466.582019, -381.239579, 3.440192
	3191594.449302, -119.470102, 1.125202
	3183159.664481, 17.721542, -0.153070
	3176791.037916, 107.407930, -0.957123
	3171474.720102, 190.159212, -1.751515
	3166582.715676, 281.955770, -2.675074
	3163316.106670, 318.670366, -2.988620
	3160957.710763, 338.412885, -3.164299
drift_calibration_min_temp = 33.83103284492943

[bed_mesh]
speed = 50
horizontal_move_z = 1
mesh_min = 50,60
mesh_max = 280, 310
probe_count = 9, 9
mesh_pps = 3, 3
algorithm = bicubic
bicubic_tension = 0.2

[safe_z_home]
home_xy_position = 204, 185
speed = 50
z_hop = 10
z_hop_speed = 10

[save_variables]
filename = ~/printer_data/config/variables.cfg

[force_move]
enable_force_move = True

[delayed_gcode RESTORE_PROBE_OFFSET]
initial_duration = 1.
gcode = 
	{% set svv = printer.save_variables.variables %}
	{% if not printer["gcode_macro SET_GCODE_OFFSET"].restored %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ svv.nvm_offset|default(0) }
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=restored VALUE=True
	{% endif %}

[gcode_macro G28]
rename_existing = G28.1
gcode = 
	
	G28.1 {rawparams}
	{% if not rawparams or (rawparams and 'Z' in rawparams) %}
	PROBE
	SET_Z_FROM_PROBE
	{% endif %}

[gcode_macro SET_Z_FROM_PROBE]
gcode = 
	{% set cf = printer.configfile.settings %}
	SET_GCODE_OFFSET_ORIG Z={printer.probe.last_z_result - cf['probe_eddy_current btt_eddy'].z_offset + printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset}
	G90
	G1 Z{cf.safe_z_home.z_hop}

[gcode_macro Z_OFFSET_APPLY_PROBE]
rename_existing = Z_OFFSET_APPLY_PROBE_ORIG
gcode = 
	SAVE_VARIABLE VARIABLE=nvm_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset }

[gcode_macro SET_GCODE_OFFSET]
rename_existing = SET_GCODE_OFFSET_ORIG
variable_restored = False
variable_runtime_offset = 0
gcode = 
	{% if params.Z_ADJUST %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset + params.Z_ADJUST|float }
	{% endif %}
	{% if params.Z %}
	{% set paramList = rawparams.split() %}
	{% for i in range(paramList|length) %}
	{% if paramList[i]=="Z=0" %}
	{% set temp=paramList.pop(i) %}
	{% set temp="Z_ADJUST=" + (-printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset)|string %}
	{% if paramList.append(temp) %}{% endif %}
	{% endif %}
	{% endfor %}
	{% set rawparams=paramList|join(' ') %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE=0
	{% endif %}
	SET_GCODE_OFFSET_ORIG { rawparams }

[gcode_macro PROBE_EDDY_CURRENT_CALIBRATE_AUTO]
gcode = 
	BED_MESH_CLEAR
	G28 X Y
	G90
	G1 X{ printer.toolhead.axis_maximum.x/2 } Y{ printer.toolhead.axis_maximum.y/2 } F6000
	{% if 'z' not in printer.toolhead.homed_axes %}
	SET_KINEMATIC_POSITION Z={ printer.toolhead.axis_maximum.z-1 }
	{% endif %}
	PROBE_EDDY_CURRENT_CALIBRATE {rawparams}

[mcu]
serial = /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00

[stepper_x]
step_pin = PC14
dir_pin = !PC13
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA14
position_endstop = 0
position_min = 0
position_max = 330
homing_speed = 50

[stepper_y]
step_pin = PE5
dir_pin = PE4
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA15
position_endstop = 0
position_min = 0
position_max = 320
homing_speed = 50

[stepper_z1]
step_pin = PE1
dir_pin = PE0
enable_pin = !PE2
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop

[stepper_z]
step_pin = PD6
dir_pin = PD5
enable_pin = !PD7
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop
position_max = 400
position_min = -5
homing_speed = 10

[screws_tilt_adjust]
screw1 = 204,185
screw1_name = Central screw
screw2 = 105,84
screw2_name = Front left screw
screw3 = 305,84
screw3_name = Rear left screw
screw4 = 305,284
screw4_name = Front right screw
screw5 = 105, 284
screw5_name = Rear right screw
horizontal_move_z = 10
speed = 100
screw_thread = CW-M3

[bed_screws]
screw1 = 50,70
screw2 = 250,70
screw3 = 250, 230
screw4 = 50, 230

[z_tilt]
z_positions = -60, 155
	330, 155
points = 70, 184
	300, 184
speed = 100
horizontal_move_z = 10
retries = 8
retry_tolerance = 0.005

[extruder]
step_pin = PB5
dir_pin = !PB4
enable_pin = !PB6
microsteps = 16
rotation_distance = 8.06
nozzle_diameter = 0.400
filament_diameter = 1.750
heater_pin = PB1
sensor_type = ATC Semitec 104GT-2
sensor_pin = PC1
max_extrude_only_distance = 100000
min_temp = 0
max_temp = 260
pressure_advance = 0.08
control = pid
pid_kp = 39.588
pid_ki = 7.762
pid_kd = 50.475

[heater_bed]
heater_pin = PB10
sensor_type = ATC Semitec 104NT-4-R025H42G
sensor_pin = PC0
min_temp = 0
max_temp = 130
control = pid
pid_kp = 57.129
pid_ki = 2.026
pid_kd = 402.756
x_count = 4
y_count = 4
mesh_x_pps = 2
mesh_y_pps = 2
algo = bicubic
tension = 0.2
min_x = 40.0
max_x = 256.0
min_y = 60.0
max_y = 279.98999999999995

[fan]
pin = PA2
max_power = 1.0
off_below = 0.1

[heater_fan hotend]
pin = PA0
heater = extruder
heater_temp = 50.0
fan_speed = 1.0
shutdown_speed = 1.0

[printer]
kinematics = cartesian
max_velocity = 250
max_accel = 4500
max_z_velocity = 25
max_z_accel = 100

[skew_correction]

[bed_mesh default]
version = 1
points = 
	0.077380, 0.111423, 0.114676, 0.156457, 0.174093, 0.168682, 0.150091, 0.125241, 0.144394
	0.019770, 0.035236, 0.040041, 0.064163, 0.097841, 0.072235, 0.036121, 0.038328, -0.022320
	-0.046588, -0.004041, -0.002183, 0.034924, 0.056260, 0.057109, 0.025641, -0.003699, 0.000421
	-0.014058, -0.015146, -0.014967, 0.007296, 0.033845, 0.025323, -0.004179, -0.028621, -0.045631
	-0.053217, -0.062006, -0.048567, -0.019670, -0.003835, 0.000873, -0.021848, -0.046722, -0.038119
	-0.082454, -0.064824, -0.071665, -0.049962, -0.027577, -0.036043, -0.056768, -0.072205, -0.063067
	0.026282, -0.006652, -0.015925, 0.013883, 0.040249, 0.050473, 0.018200, -0.017486, -0.044483
	0.006865, 0.029730, 0.028595, 0.044249, 0.088176, 0.080421, 0.046590, 0.046284, 0.075516
	0.059874, -0.031578, -0.021740, 0.006004, 0.063576, 0.092164, 0.028281, -0.012436, -0.035619
x_count = 9
y_count = 9
mesh_x_pps = 3
mesh_y_pps = 3
algo = bicubic
tension = 0.2
min_x = 50.0
max_x = 280.0
min_y = 60.0
max_y = 310.0

[skew_correction mi_skew]
xy_skew = -0.00679190845337054
xz_skew = 0.0
yz_skew = 0.0
=======================
temperature_probe btt_eddy: loaded temperature drift calibration. Min Temp: 33.83, Min Freq: 3156001.351363
y(x) = 60.398093x^2 - 5564.540372x + 3322659.134314
y(x) = 3.440192x^2 - 381.239579x + 3204466.582019
y(x) = 1.125202x^2 - 119.470102x + 3191594.449302
y(x) = -0.153070x^2 + 17.721542x + 3183159.664481
y(x) = -0.957123x^2 + 107.407930x + 3176791.037916
y(x) = -1.751515x^2 + 190.159212x + 3171474.720102
y(x) = -2.675074x^2 + 281.955770x + 3166582.715676
y(x) = -2.988620x^2 + 318.670366x + 3163316.106670
y(x) = -3.164299x^2 + 338.412885x + 3160957.710763
temperature_probe btt_eddy: registered drift compensation with probe [probe_eddy_current btt_eddy]
Extruder max_extrude_ratio=0.266081
mcu 'mcu': Starting serial connect
Loaded MCU 'mcu' 144 commands (v0.13.0-320-gc80324946 / gcc: (15:12.2.rel1-1) 12.2.1 20221205 binutils: (2.40-2+18+b1) 2.40)
MCU 'mcu' config: ADC_MAX=4095 BUS_PINS_i2c1=PB6,PB7 BUS_PINS_i2c1a=PB8,PB9 BUS_PINS_i2c2=PB10,PB11 BUS_PINS_i2c2_PF1_PF0=PF1,PF0 BUS_PINS_i2c2a=PH4,PH5 BUS_PINS_i2c3=PA8,PC9 BUS_PINS_i2c3a=PH7,PH8 BUS_PINS_sdio=PC12,PD2,PC8,PC9,PC10,PC11 BUS_PINS_spi1=PA6,PA7,PA5 BUS_PINS_spi1_PA6_PA7_PA5=PA6,PA7,PA5 BUS_PINS_spi1_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi1a=PB4,PB5,PB3 BUS_PINS_spi2=PB14,PB15,PB13 BUS_PINS_spi2_PB14_PB15_PB13=PB14,PB15,PB13 BUS_PINS_spi2_PC2_PC3_PB10=PC2,PC3,PB10 BUS_PINS_spi2_PI2_PI3_PI1=PI2,PI3,PI1 BUS_PINS_spi2a=PC2,PC3,PB10 BUS_PINS_spi2b=PI2,PI3,PI1 BUS_PINS_spi3=PB4,PB5,PB3 BUS_PINS_spi3_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi3_PC11_PC12_PC10=PC11,PC12,PC10 BUS_PINS_spi3a=PC11,PC12,PC10 CLOCK_FREQ=168000000 MCU=stm32f407xx PWM_MAX=257 RESERVE_PINS_USB=PA11,PA12 RESERVE_PINS_crystal=PH0,PH1 STATS_SUMSQ_BASE=256 STEPPER_OPTIMIZED_EDGE=21 STEPPER_STEP_BOTH_EDGE=1
mcu 'eddy': Starting serial connect
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
webhooks client 548547174928: New connection
webhooks client 548547174928: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
mcu 'eddy': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00'
MCU error during connect
Traceback (most recent call last):
  File "/home/luis/klipper/klippy/mcu.py", line 772, in _attach
    self._serial.connect_uart(self._serialport, self._baud, rts)
  File "/home/luis/klipper/klippy/serialhdl.py", line 191, in connect_uart
    self._error("Unable to connect")
  File "/home/luis/klipper/klippy/serialhdl.py", line 68, in _error
    raise error(self.warn_prefix + (msg % params))
serialhdl.error: mcu 'eddy': Unable to connect

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/luis/klipper/klippy/klippy.py", line 131, in _connect
    self.send_event("klippy:mcu_identify")
  File "/home/luis/klipper/klippy/klippy.py", line 223, in send_event
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/luis/klipper/klippy/klippy.py", line 223, in <listcomp>
    return [cb(*params) for cb in self.event_handlers.get(event, [])]
            ^^^^^^^^^^^
  File "/home/luis/klipper/klippy/mcu.py", line 782, in _mcu_identify
    self._attach()
  File "/home/luis/klipper/klippy/mcu.py", line 777, in _attach
    raise error(str(e))
mcu.error: mcu 'eddy': Unable to connect
mcu 'eddy': Unable to connect
Once the underlying issue is corrected, use the
"FIRMWARE_RESTART" command to reset the firmware, reload the
config, and restart the host software.
Error configuring printer

Build file /home/luis/klipper/klippy/../.config(3230): Thu Jan  8 16:00:18 2026
========= Last MCU build config =========
# CONFIG_LOW_LEVEL_OPTIONS is not set
# CONFIG_MACH_AVR is not set
# CONFIG_MACH_ATSAM is not set
# CONFIG_MACH_ATSAMD is not set
# CONFIG_MACH_LPC176X is not set
CONFIG_MACH_STM32=y
# CONFIG_MACH_HC32F460 is not set
# CONFIG_MACH_RPXXXX is not set
# CONFIG_MACH_PRU is not set
# CONFIG_MACH_AR100 is not set
# CONFIG_MACH_LINUX is not set
# CONFIG_MACH_SIMU is not set
CONFIG_BOARD_DIRECTORY="stm32"
CONFIG_MCU="stm32f407xx"
CONFIG_CLOCK_FREQ=168000000
CONFIG_USBSERIAL=y
CONFIG_FLASH_SIZE=0x80000
CONFIG_FLASH_BOOT_ADDRESS=0x8000000
CONFIG_RAM_START=0x20000000
CONFIG_RAM_SIZE=0x20000
CONFIG_STACK_SIZE=512
CONFIG_FLASH_APPLICATION_ADDRESS=0x800C000
CONFIG_STM32_SELECT=y
# CONFIG_MACH_STM32F103 is not set
# CONFIG_MACH_STM32F207 is not set
# CONFIG_MACH_STM32F401 is not set
# CONFIG_MACH_STM32F405 is not set
CONFIG_MACH_STM32F407=y
# CONFIG_MACH_STM32F429 is not set
# CONFIG_MACH_STM32F446 is not set
# CONFIG_MACH_STM32F765 is not set
# CONFIG_MACH_STM32F031 is not set
# CONFIG_MACH_STM32F042 is not set
# CONFIG_MACH_STM32F070 is not set
# CONFIG_MACH_STM32F072 is not set
# CONFIG_MACH_STM32G070 is not set
# CONFIG_MACH_STM32G071 is not set
# CONFIG_MACH_STM32G0B0 is not set
# CONFIG_MACH_STM32G0B1 is not set
# CONFIG_MACH_STM32G431 is not set
# CONFIG_MACH_STM32G474 is not set
# CONFIG_MACH_STM32H723 is not set
# CONFIG_MACH_STM32H743 is not set
# CONFIG_MACH_STM32H750 is not set
# CONFIG_MACH_STM32L412 is not set
# CONFIG_MACH_N32G452 is not set
# CONFIG_MACH_N32G455 is not set
CONFIG_MACH_STM32F4=y
CONFIG_MACH_STM32F4x5=y
CONFIG_HAVE_STM32_USBOTG=y
CONFIG_HAVE_STM32_CANBUS=y
CONFIG_HAVE_STM32_USBCANBUS=y
CONFIG_STM32_DFU_ROM_ADDRESS=0x1fff0000
# CONFIG_STM32_FLASH_START_8000 is not set
# CONFIG_STM32_FLASH_START_20200 is not set
CONFIG_STM32_FLASH_START_C000=y
# CONFIG_STM32_FLASH_START_10000 is not set
# CONFIG_STM32_FLASH_START_4000 is not set
# CONFIG_STM32_FLASH_START_0000 is not set
CONFIG_CLOCK_REF_FREQ=8000000
CONFIG_STM32F0_TRIM=16
CONFIG_STM32_USB_PA11_PA12=y
# CONFIG_STM32_SERIAL_USART1 is not set
# CONFIG_STM32_CANBUS_PA11_PA12 is not set
# CONFIG_STM32_CANBUS_PA11_PB9 is not set
# CONFIG_STM32_USBCANBUS_PA11_PA12 is not set
CONFIG_USB=y
CONFIG_USB_VENDOR_ID=0x1d50
CONFIG_USB_DEVICE_ID=0x614e
CONFIG_USB_SERIAL_NUMBER_CHIPID=y
CONFIG_USB_SERIAL_NUMBER="12345"
CONFIG_WANT_ADC=y
CONFIG_WANT_SPI=y
CONFIG_WANT_SOFTWARE_SPI=y
CONFIG_WANT_I2C=y
CONFIG_WANT_SOFTWARE_I2C=y
CONFIG_WANT_HARD_PWM=y
CONFIG_WANT_BUTTONS=y
CONFIG_WANT_TMCUART=y
CONFIG_WANT_NEOPIXEL=y
CONFIG_WANT_PULSE_COUNTER=y
CONFIG_WANT_ST7920=y
CONFIG_WANT_HD44780=y
CONFIG_WANT_ADXL345=y
CONFIG_WANT_LIS2DW=y
CONFIG_WANT_MPU9250=y
CONFIG_WANT_ICM20948=y
CONFIG_WANT_THERMOCOUPLE=y
CONFIG_WANT_HX71X=y
CONFIG_WANT_ADS1220=y
CONFIG_WANT_LDC1612=y
CONFIG_WANT_SENSOR_ANGLE=y
CONFIG_NEED_SENSOR_BULK=y
CONFIG_WANT_LOAD_CELL_PROBE=y
CONFIG_NEED_SOS_FILTER=y
CONFIG_CANBUS_FREQUENCY=1000000
CONFIG_INLINE_STEPPER_HACK=y
CONFIG_HAVE_STEPPER_OPTIMIZED_BOTH_EDGE=y
CONFIG_WANT_STEPPER_OPTIMIZED_BOTH_EDGE=y
CONFIG_HAVE_GPIO=y
CONFIG_HAVE_GPIO_ADC=y
CONFIG_HAVE_GPIO_SPI=y
CONFIG_HAVE_GPIO_SDIO=y
CONFIG_HAVE_GPIO_I2C=y
CONFIG_HAVE_GPIO_HARD_PWM=y
CONFIG_HAVE_STRICT_TIMING=y
CONFIG_HAVE_CHIPID=y
CONFIG_HAVE_BOOTLOADER_REQUEST=y
=======================
Build file /home/luis/klipper/klippy/../out/klipper.dict(10971): Thu Jan  8 16:01:08 2026
Last MCU build version: v0.13.0-320-gc80324946
Last MCU build tools: gcc: (15:12.2.rel1-1) 12.2.1 20221205 binutils: (2.40-2+18+b1) 2.40
Last MCU build config: ADC_MAX=4095 BUS_PINS_i2c1=PB6,PB7 BUS_PINS_i2c1a=PB8,PB9 BUS_PINS_i2c2=PB10,PB11 BUS_PINS_i2c2_PF1_PF0=PF1,PF0 BUS_PINS_i2c2a=PH4,PH5 BUS_PINS_i2c3=PA8,PC9 BUS_PINS_i2c3a=PH7,PH8 BUS_PINS_sdio=PC12,PD2,PC8,PC9,PC10,PC11 BUS_PINS_spi1=PA6,PA7,PA5 BUS_PINS_spi1_PA6_PA7_PA5=PA6,PA7,PA5 BUS_PINS_spi1_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi1a=PB4,PB5,PB3 BUS_PINS_spi2=PB14,PB15,PB13 BUS_PINS_spi2_PB14_PB15_PB13=PB14,PB15,PB13 BUS_PINS_spi2_PC2_PC3_PB10=PC2,PC3,PB10 BUS_PINS_spi2_PI2_PI3_PI1=PI2,PI3,PI1 BUS_PINS_spi2a=PC2,PC3,PB10 BUS_PINS_spi2b=PI2,PI3,PI1 BUS_PINS_spi3=PB4,PB5,PB3 BUS_PINS_spi3_PB4_PB5_PB3=PB4,PB5,PB3 BUS_PINS_spi3_PC11_PC12_PC10=PC11,PC12,PC10 BUS_PINS_spi3a=PC11,PC12,PC10 CLOCK_FREQ=168000000 MCU=stm32f407xx PWM_MAX=257 RESERVE_PINS_USB=PA11,PA12 RESERVE_PINS_crystal=PH0,PH1 STATS_SUMSQ_BASE=256 STEPPER_OPTIMIZED_EDGE=21 STEPPER_STEP_BOTH_EDGE=1
Build file /home/luis/klipper/klippy/../out/klipper.elf(1299984): Thu Jan  8 16:01:21 2026
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         Starting Klippy...
Args: ['/home/luis/klipper/klippy/klippy.py', '/home/luis/printer_data/config/printer.cfg', '-l', '/home/luis/printer_data/logs/klippy.log', '-I', '/home/luis/printer_data/comms/klippy.serial', '-a', '/home/luis/printer_data/comms/klippy.sock']
Git version: 'v0.13.0-320-gc80324946'
Branch: master
Remote: origin
Tracked URL: https://github.com/Klipper3d/klipper.git
CPU: 4 core ?
Device: Raspberry Pi 3 Model B Plus Rev 1.3
Linux: Linux version 6.12.47+rpt-rpi-v8 (serge@raspberrypi.com) (aarch64-linux-gnu-gcc-12 (Debian 12.2.0-14+deb12u1) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT Debian 1:6.12.47-1+rpt1~bookworm (2025-09-16)
Python: '3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]'
Start printer at Thu Jan  8 16:32:35 2026 (1767889955.6 35.3)
===== Config file =====
[virtual_sdcard]
path = /home/luis/printer_data/gcodes
on_error_gcode = CANCEL_PRINT

[pause_resume]

[display_status]

[respond]

[gcode_macro CANCEL_PRINT]
description = Cancel the actual running print
rename_existing = CANCEL_PRINT_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set allow_park = client.park_at_cancel|default(false)|lower == 'true' %}
	{% set retract = client.cancel_retract|default(5.0)|abs %}
	
	{% set park_x = "" if (client.park_at_cancel_x|default(none) is none)
	else "X=" ~ client.park_at_cancel_x %}
	{% set park_y = "" if (client.park_at_cancel_y|default(none) is none)
	else "Y=" ~ client.park_at_cancel_y %}
	{% set custom_park = park_x|length > 0 or park_y|length > 0 %}
	
	
	{% if printer['gcode_macro RESUME'].restore_idle_timeout > 0 %}
	SET_IDLE_TIMEOUT TIMEOUT={printer['gcode_macro RESUME'].restore_idle_timeout}
	{% endif %}
	{% if (custom_park or not printer.pause_resume.is_paused) and allow_park %} _TOOLHEAD_PARK_PAUSE_CANCEL {park_x} {park_y} {% endif %}
	_CLIENT_RETRACT LENGTH={retract}
	TURN_OFF_HEATERS
	M106 S0
	{client.user_cancel_macro|default("")}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	
	SET_PAUSE_NEXT_LAYER ENABLE=0
	SET_PAUSE_AT_LAYER ENABLE=0 LAYER=0
	CANCEL_PRINT_BASE

[gcode_macro PAUSE]
description = Pause the actual running print
rename_existing = PAUSE_BASE
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set idle_timeout = client.idle_timeout|default(0) %}
	{% set temp = printer[printer.toolhead.extruder].target if printer.toolhead.extruder != '' else 0 %}
	{% set restore = False if printer.toolhead.extruder == ''
	else True  if params.RESTORE|default(1)|int == 1 else False %}
	
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=last_extruder_temp VALUE="{{'restore': restore, 'temp': temp}}"
	
	{% if idle_timeout > 0 %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=restore_idle_timeout VALUE={printer.configfile.settings.idle_timeout.timeout}
	SET_IDLE_TIMEOUT TIMEOUT={idle_timeout}
	{% endif %}
	PAUSE_BASE
	{client.user_pause_macro|default("")}
	_TOOLHEAD_PARK_PAUSE_CANCEL {rawparams}

[gcode_macro RESUME]
description = Resume the actual running print
rename_existing = RESUME_BASE
variable_last_extruder_temp = {'restore': False, 'temp': 0}
variable_restore_idle_timeout = 0
variable_idle_state = False
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set sp_move = client.speed_move|default(velocity) %}
	{% set runout_resume = True if client.runout_sensor|default("") == ""
	else True if not printer[client.runout_sensor].enabled
	else printer[client.runout_sensor].filament_detected %}
	{% set can_extrude = True if printer.toolhead.extruder == ''
	else printer[printer.toolhead.extruder].can_extrude %}
	{% set do_resume = False %}
	{% set prompt_txt = [] %}
	
	
	{% if printer.idle_timeout.state|upper == "IDLE" or idle_state %}
	SET_GCODE_VARIABLE MACRO=RESUME VARIABLE=idle_state VALUE=False
	{% if last_extruder_temp.restore %}
	
	RESPOND TYPE=echo MSG='{"Restoring \\"%s\\" temperature to %3.1f\\u00B0C, this may take some time" % (printer.toolhead.extruder, last_extruder_temp.temp) }'
	M109 S{last_extruder_temp.temp}
	{% set do_resume = True %}
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	
	{% elif can_extrude %}
	{% set do_resume = True %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder}'
	{% set _d = prompt_txt.append("\\"%s\\" not hot enough, please heat up again and press RESUME" % printer.toolhead.extruder) %}
	{% endif %}
	{% if runout_resume %}
	{% if do_resume %}
	{% if restore_idle_timeout > 0 %} SET_IDLE_TIMEOUT TIMEOUT={restore_idle_timeout} {% endif %}
	{client.user_resume_macro|default("")}
	_CLIENT_EXTRUDE
	RESUME_BASE VELOCITY={params.VELOCITY|default(sp_move)}
	{% endif %}
	{% else %}
	RESPOND TYPE=error MSG='{"Resume aborted !!! \\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]}'
	{% set _d = prompt_txt.append("\\"%s\\" detects no filament, please load filament and press RESUME" % (client.runout_sensor.split(" "))[1]) %}
	{% endif %}
	
	{% if not (runout_resume and do_resume) %}
	RESPOND TYPE=command MSG="action:prompt_begin RESUME aborted !!!"
	{% for element in prompt_txt %}
	RESPOND TYPE=command MSG='{"action:prompt_text %s" % element}'
	{% endfor %}
	RESPOND TYPE=command MSG="action:prompt_footer_button Ok|RESPOND TYPE=command MSG=action:prompt_end|info"
	RESPOND TYPE=command MSG="action:prompt_show"
	{% endif %}

[gcode_macro SET_PAUSE_NEXT_LAYER]
description = Enable a pause if the next layer is reached
gcode = 
	{% set pause_next_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_next_layer %}
	{% set ENABLE = params.ENABLE|default(1)|int != 0 %}
	{% set MACRO = params.MACRO|default(pause_next_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_next_layer VALUE="{{ 'enable': ENABLE, 'call': MACRO }}"

[gcode_macro SET_PAUSE_AT_LAYER]
description = Enable/disable a pause if a given layer number is reached
gcode = 
	{% set pause_at_layer = printer['gcode_macro SET_PRINT_STATS_INFO'].pause_at_layer %}
	{% set ENABLE = params.ENABLE|int != 0 if params.ENABLE is defined
	else params.LAYER is defined %}
	{% set LAYER = params.LAYER|default(pause_at_layer.layer)|int %}
	{% set MACRO = params.MACRO|default(pause_at_layer.call, True) %}
	SET_GCODE_VARIABLE MACRO=SET_PRINT_STATS_INFO VARIABLE=pause_at_layer VALUE="{{ 'enable': ENABLE, 'layer': LAYER, 'call': MACRO }}"

[gcode_macro SET_PRINT_STATS_INFO]
rename_existing = SET_PRINT_STATS_INFO_BASE
description = Overwrite, to get pause_next_layer and pause_at_layer feature
variable_pause_next_layer = { 'enable': False, 'call': "PAUSE" }
variable_pause_at_layer = { 'enable': False, 'layer': 0, 'call': "PAUSE" }
gcode = 
	{% if pause_next_layer.enable %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_next_layer" % pause_next_layer.call}'
	{pause_next_layer.call}
	SET_PAUSE_NEXT_LAYER ENABLE=0
	{% elif pause_at_layer.enable and params.CURRENT_LAYER is defined and params.CURRENT_LAYER|int == pause_at_layer.layer %}
	RESPOND TYPE=echo MSG='{"%s, forced by pause_at_layer [%d]" % (pause_at_layer.call, pause_at_layer.layer)}'
	{pause_at_layer.call}
	SET_PAUSE_AT_LAYER ENABLE=0
	{% endif %}
	SET_PRINT_STATS_INFO_BASE {rawparams}

[gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL]
description = Helper: park toolhead used in PAUSE and CANCEL_PRINT
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set velocity = printer.configfile.settings.pause_resume.recover_velocity %}
	{% set use_custom     = client.use_custom_pos|default(false)|lower == 'true' %}
	{% set custom_park_x  = client.custom_park_x|default(0.0) %}
	{% set custom_park_y  = client.custom_park_y|default(0.0) %}
	{% set park_dz        = client.custom_park_dz|default(2.0)|abs %}
	{% set sp_hop         = client.speed_hop|default(15) * 60 %}
	{% set sp_move        = client.speed_move|default(velocity) * 60 %}
	
	{% set origin    = printer.gcode_move.homing_origin %}
	{% set act       = printer.gcode_move.gcode_position %}
	{% set max       = printer.toolhead.axis_maximum %}
	{% set cone      = printer.toolhead.cone_start_z|default(max.z) %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	
	{% set z_min = params.Z_MIN|default(0)|float %}
	{% set z_park = [[(act.z + park_dz), z_min]|max, (max.z - origin.z)]|min %}
	{% set x_park = params.X       if params.X is defined
	else custom_park_x  if use_custom
	else 0.0            if round_bed
	else (max.x - 5.0) %}
	{% set y_park = params.Y       if params.Y is defined
	else custom_park_y  if use_custom
	else (max.y - 5.0)  if round_bed and z_park < cone
	else 0.0            if round_bed
	else (max.y - 5.0) %}
	
	_CLIENT_RETRACT
	{% if "xyz" in printer.toolhead.homed_axes %}
	G90
	G1 Z{z_park} F{sp_hop}
	G1 X{x_park} Y{y_park} F{sp_move}
	{% if not printer.gcode_move.absolute_coordinates %} G91 {% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='Printer not homed'
	{% endif %}

[gcode_macro _CLIENT_EXTRUDE]
description = Extrudes, if the extruder is hot enough
gcode = 
	
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set use_fw_retract = (client.use_fw_retract|default(false)|lower == 'true') and (printer.firmware_retraction is defined) %}
	{% set length = params.LENGTH|default(client.unretract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_unretract)|default(35) %}
	{% set absolute_extrude = printer.gcode_move.absolute_extrude %}
	
	{% if printer.toolhead.extruder != '' %}
	{% if printer[printer.toolhead.extruder].can_extrude %}
	{% if use_fw_retract %}
	{% if length < 0 %}
	G10
	{% else %}
	G11
	{% endif %}
	{% else %}
	M83
	G1 E{length} F{(speed|float|abs) * 60}
	{% if absolute_extrude %}
	M82
	{% endif %}
	{% endif %}
	{% else %}
	RESPOND TYPE=echo MSG='{"\\"%s\\" not hot enough" % printer.toolhead.extruder}'
	{% endif %}
	{% endif %}

[gcode_macro _CLIENT_RETRACT]
description = Retracts, if the extruder is hot enough
gcode = 
	{% set client = printer['gcode_macro _CLIENT_VARIABLE']|default({}) %}
	{% set length = params.LENGTH|default(client.retract)|default(1.0)|float %}
	{% set speed = params.SPEED|default(client.speed_retract)|default(35) %}
	
	_CLIENT_EXTRUDE LENGTH=-{length|float|abs} SPEED={speed|float|abs}

[gcode_macro _CLIENT_LINEAR_MOVE]
description = Linear move with save and restore of the gcode state
gcode = 
	{% set x_move = "X" ~ params.X if params.X is defined else "" %}
	{% set y_move = "Y" ~ params.Y if params.Y is defined else "" %}
	{% set z_move = "Z" ~ params.Z if params.Z is defined else "" %}
	{% set e_move = "E" ~ params.E if params.E is defined else "" %}
	{% set rate = "F" ~ params.F if params.F is defined else "" %}
	{% set ABSOLUTE = params.ABSOLUTE | default(0) | int != 0 %}
	{% set ABSOLUTE_E = params.ABSOLUTE_E | default(0) | int != 0 %}
	SAVE_GCODE_STATE NAME=_client_movement
	{% if x_move or y_move or z_move %}
	G9{ 0 if ABSOLUTE else 1 }
	{% endif %}
	{% if e_move %}
	M8{ 2 if ABSOLUTE_E else 3 }
	{% endif %}
	G1 { x_move } { y_move } { z_move } { e_move } { rate }
	RESTORE_GCODE_STATE NAME=_client_movement

[gcode_macro GET_TIMELAPSE_SETUP]
description = Print the Timelapse setup
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set output_txt = ["Timelapse Setup:"] %}
	{% set _dummy = output_txt.append("enable: %s" % tl.enable) %}
	{% set _dummy = output_txt.append("park: %s" % tl.park.enable) %}
	{% if tl.park.enable %}
	{% set _dummy = output_txt.append("park position: %s time: %s s" % (tl.park.pos, tl.park.time)) %}
	{% set _dummy = output_txt.append("park cord x:%s y:%s dz:%s" % (tl.park.coord.x, tl.park.coord.y, tl.park.coord.dz)) %}
	{% set _dummy = output_txt.append("travel speed: %s mm/s" % tl.speed.travel) %}
	{% endif %}
	{% set _dummy = output_txt.append("fw_retract: %s" % tl.extruder.fw_retract) %}
	{% if not tl.extruder.fw_retract %}
	{% set _dummy = output_txt.append("retract: %s mm speed: %s mm/s" % (tl.extruder.retract, tl.speed.retract)) %}
	{% set _dummy = output_txt.append("extrude: %s mm speed: %s mm/s" % (tl.extruder.extrude, tl.speed.extrude)) %}
	{% endif %}
	{% set _dummy = output_txt.append("verbose: %s" % tl.verbose) %}
	{action_respond_info(output_txt|join("\\n"))}

[gcode_macro _SET_TIMELAPSE_SETUP]
description = Set user parameters for timelapse
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set round_bed = True if printer.configfile.settings.printer.kinematics is in ['delta','polar','rotary_delta','winch']
	else False %}
	{% set park = {'min'   : {'x': (min.x / 1.42)|round(3) if round_bed else min.x|round(3),
	'y': (min.y / 1.42)|round(3) if round_bed else min.y|round(3)},
	'max'   : {'x': (max.x / 1.42)|round(3) if round_bed else max.x|round(3),
	'y': (max.y / 1.42)|round(3) if round_bed else max.y|round(3)},
	'center': {'x': (max.x-(max.x-min.x)/2)|round(3),
	'y': (max.y-(max.y-min.y)/2)|round(3)}} %}
	
	{% if params.ENABLE %}
	{% if params.ENABLE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=enable VALUE={True if params.ENABLE|lower == 'true' else False}
	{% else %}
	{action_raise_error("ENABLE=%s not supported. Allowed values are [True, False]" % params.ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.VERBOSE %}
	{% if params.VERBOSE|lower is in ['true', 'false'] %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=verbose VALUE={True if params.VERBOSE|lower == 'true' else False}
	{% else %}
	{action_raise_error("VERBOSE=%s not supported. Allowed values are [True, False]" % params.VERBOSE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_X %}
	{% if params.CUSTOM_POS_X|float >= min.x and params.CUSTOM_POS_X|float <= max.x %}
	{% set _dummy = tl.park.custom.update({'x':params.CUSTOM_POS_X|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_X=%s must be within [%s - %s]" % (params.CUSTOM_POS_X, min.x, max.x))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_Y %}
	{% if params.CUSTOM_POS_Y|float >= min.y and params.CUSTOM_POS_Y|float <= max.y %}
	{% set _dummy = tl.park.custom.update({'y':params.CUSTOM_POS_Y|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_Y=%s must be within [%s - %s]" % (params.CUSTOM_POS_Y, min.y, max.y))}
	{% endif %}
	{% endif %}
	{% if params.CUSTOM_POS_DZ %}
	{% if params.CUSTOM_POS_DZ|float >= min.z and params.CUSTOM_POS_DZ|float <= max.z %}
	{% set _dummy = tl.park.custom.update({'dz':params.CUSTOM_POS_DZ|float|round(3)}) %}
	{% else %}
	{action_raise_error("CUSTOM_POS_DZ=%s must be within [%s - %s]" % (params.CUSTOM_POS_DZ, min.z, max.z))}
	{% endif %}
	{% endif %}
	{% if params.PARK_ENABLE %}
	{% if params.PARK_ENABLE|lower is in ['true', 'false'] %}
	{% set _dummy = tl.park.update({'enable':True if params.PARK_ENABLE|lower == 'true' else False}) %}
	{% else %}
	{action_raise_error("PARK_ENABLE=%s not supported. Allowed values are [True, False]" % params.PARK_ENABLE|capitalize)}
	{% endif %}
	{% endif %}
	{% if params.PARK_POS %}
	{% if params.PARK_POS|lower is in ['center','front_left','front_right','back_left','back_right','custom','x_only','y_only'] %}
	{% set dic = {'center'      : {'x': park.center.x   , 'y': park.center.y   , 'dz': 1                },
	'front_left'  : {'x': park.min.x      , 'y': park.min.y      , 'dz': 0                },
	'front_right' : {'x': park.max.x      , 'y': park.min.y      , 'dz': 0                },
	'back_left'   : {'x': park.min.x      , 'y': park.max.y      , 'dz': 0                },
	'back_right'  : {'x': park.max.x      , 'y': park.max.y      , 'dz': 0                },
	'custom'      : {'x': tl.park.custom.x, 'y': tl.park.custom.y, 'dz': tl.park.custom.dz},
	'x_only'      : {'x': tl.park.custom.x, 'y': 'none'          , 'dz': tl.park.custom.dz},
	'y_only'      : {'x': 'none'          , 'y': tl.park.custom.y, 'dz': tl.park.custom.dz}} %}
	{% set _dummy = tl.park.update({'pos':params.PARK_POS|lower}) %}
	{% set _dummy = tl.park.update({'coord':dic[tl.park.pos]}) %}
	{% else %}
	{action_raise_error("PARK_POS=%s not supported. Allowed values are [CENTER, FRONT_LEFT, FRONT_RIGHT, BACK_LEFT, BACK_RIGHT, CUSTOM, X_ONLY, Y_ONLY]"
	% params.PARK_POS|upper)}
	{% endif %}
	{% endif %}
	{% if params.PARK_TIME %}
	{% if params.PARK_TIME|float >= 0.0 %}
	{% set _dummy = tl.park.update({'time':params.PARK_TIME|float|round(3)}) %}
	{% else %}
	{action_raise_error("PARK_TIME=%s must be a positive number" % params.PARK_TIME)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=park VALUE="{tl.park}"
	{% if params.TRAVEL_SPEED %}
	{% if params.TRAVEL_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'travel':params.TRAVEL_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("TRAVEL_SPEED=%s must be larger than 0" % params.TRAVEL_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_SPEED %}
	{% if params.RETRACT_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'retract':params.RETRACT_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_SPEED=%s must be larger than 0" % params.RETRACT_SPEED)}
	{% endif %}
	{% endif %}
	{% if params.EXTRUDE_SPEED %}
	{% if params.EXTRUDE_SPEED|float > 0.0 %}
	{% set _dummy = tl.speed.update({'extrude':params.EXTRUDE_SPEED|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_SPEED=%s must be larger than 0" % params.EXTRUDE_SPEED)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=speed VALUE="{tl.speed}"
	{% if params.EXTRUDE_DISTANCE %}
	{% if params.EXTRUDE_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'extrude':params.EXTRUDE_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("EXTRUDE_DISTANCE=%s must be specified as positiv number" % params.EXTRUDE_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.RETRACT_DISTANCE %}
	{% if params.RETRACT_DISTANCE|float >= 0.0 %}
	{% set _dummy = tl.extruder.update({'retract':params.RETRACT_DISTANCE|float|round(3)}) %}
	{% else %}
	{action_raise_error("RETRACT_DISTANCE=%s must be specified as positiv number" % params.RETRACT_DISTANCE)}
	{% endif %}
	{% endif %}
	{% if params.FW_RETRACT %}
	{% if params.FW_RETRACT|lower is in ['true', 'false'] %}
	{% if 'firmware_retraction' in printer.configfile.settings %}
	{% set _dummy = tl.extruder.update({'fw_retract': True if params.FW_RETRACT|lower == 'true' else False}) %}
	{% else %}
	{% set _dummy = tl.extruder.update({'fw_retract':False}) %}
	{% if params.FW_RETRACT|capitalize == 'True' %}
	{action_raise_error("[firmware_retraction] not defined in printer.cfg. Can not enable fw_retract")}
	{% endif %}
	{% endif %}
	{% else %}
	{action_raise_error("FW_RETRACT=%s not supported. Allowed values are [True, False]" % params.FW_RETRACT|capitalize)}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=extruder VALUE="{tl.extruder}"
	{% if printer.configfile.settings['gcode_macro pause'] is defined %}
	{% set _dummy = tl.macro.update({'pause': printer.configfile.settings['gcode_macro pause'].rename_existing}) %}
	{% endif %}
	{% if printer.configfile.settings['gcode_macro resume'] is defined %}
	{% set _dummy = tl.macro.update({'resume': printer.configfile.settings['gcode_macro resume'].rename_existing}) %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=macro VALUE="{tl.macro}"

[gcode_macro TIMELAPSE_TAKE_FRAME]
description = Take Timelapse shoot
variable_enable = False
variable_takingframe = False
variable_park = {'enable': False,
	'pos'   : 'center',
	'time'  : 0.1,
	'custom': {'x': 0, 'y': 0, 'dz': 0},
	'coord' : {'x': 0, 'y': 0, 'dz': 0}}
variable_extruder = {'fw_retract': False,
	'retract': 1.0,
	'extrude': 1.0}
variable_speed = {'travel': 100,
	'retract': 15,
	'extrude': 15}
variable_verbose = True
variable_check_time = 0.5
variable_restore = {'absolute': {'coordinates': True, 'extrude': True}, 'speed': 1500, 'e':0, 'factor': {'speed': 1.0, 'extrude': 1.0}}
variable_macro = {'pause': 'PAUSE', 'resume': 'RESUME'}
variable_is_paused = False
gcode = 
	{% set hyperlapse = True if params.HYPERLAPSE and params.HYPERLAPSE|lower =='true' else False %}
	{% if enable %}
	{% if (hyperlapse and printer['gcode_macro HYPERLAPSE'].run) or
	(not hyperlapse and not printer['gcode_macro HYPERLAPSE'].run) %}
	{% if park.enable %}
	{% set pos = {'x': 'X' + park.coord.x|string if park.pos != 'y_only' else '',
	'y': 'Y' + park.coord.y|string if park.pos != 'x_only' else '',
	'z': 'Z'+ [printer.gcode_move.gcode_position.z + park.coord.dz, printer.toolhead.axis_maximum.z]|min|string} %}
	{% set restore = {'absolute': {'coordinates': printer.gcode_move.absolute_coordinates,
	'extrude'    : printer.gcode_move.absolute_extrude},
	'speed'   : printer.gcode_move.speed,
	'e'       : printer.gcode_move.gcode_position.e,
	'factor'  : {'speed'  : printer.gcode_move.speed_factor,
	'extrude': printer.gcode_move.extrude_factor}} %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=restore VALUE="{restore}"
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, minimum extruder temperature not reached!")}{% endif %}
	{% else %}
	{% if extruder.fw_retract %}
	G10
	{% else %}
	M83
	G0 E-{extruder.retract} F{speed.retract * 60}
	{% endif %}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=True
	{macro.pause}
	SET_GCODE_OFFSET X=0 Y=0
	G90
	{% if "xyz" not in printer.toolhead.homed_axes %}
	{% if verbose %}{action_respond_info("Timelapse: Warning, axis not homed yet!")}{% endif %}
	{% else %}
	G0 {pos.x} {pos.y} {pos.z} F{speed.travel * 60}
	{% endif %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=takingframe VALUE=True
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={check_time}
	M400
	{% endif %}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE={hyperlapse}
	{% endif %}
	{% else %}
	{% if verbose %}{action_respond_info("Timelapse: disabled, take frame ignored")}{% endif %}
	{% endif %}

[gcode_macro _TIMELAPSE_NEW_FRAME]
description = action call for timelapse shoot. must be a seperate macro
gcode = 
	{action_call_remote_method("timelapse_newframe",
	macropark=printer['gcode_macro TIMELAPSE_TAKE_FRAME'].park,
	hyperlapse=params.HYPERLAPSE)}

[delayed_gcode _WAIT_TIMELAPSE_TAKE_FRAME]
gcode = 
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% set factor = {'speed': printer.gcode_move.speed_factor, 'extrude': printer.gcode_move.extrude_factor} %}
	{% if tl.takingframe %}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_TAKE_FRAME DURATION={tl.check_time}
	{% else %}
	{tl.macro.resume} VELOCITY={tl.speed.travel}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_TAKE_FRAME VARIABLE=is_paused VALUE=False
	{% if not printer[printer.toolhead.extruder].can_extrude %}
	{action_respond_info("Timelapse: Warning minimum extruder temperature not reached!")}
	{% else %}
	{% if tl.extruder.fw_retract %}
	G11
	{% else %}
	G0 E{tl.extruder.extrude} F{tl.speed.extrude * 60}
	G0 F{tl.restore.speed}
	{% if tl.restore.absolute.extrude %}
	M82
	G92 E{tl.restore.e}
	{% endif %}
	{% endif %}
	{% endif %}
	{% if tl.restore.factor.speed   != factor.speed   %} M220 S{(factor.speed*100)|round(0)}   {% endif %}
	{% if tl.restore.factor.extrude != factor.extrude %} M221 S{(factor.extrude*100)|round(0)} {% endif %}
	{% if not tl.restore.absolute.coordinates %} G91 {% endif %}
	{% endif %}

[gcode_macro HYPERLAPSE]
description = Start/Stop a hyperlapse recording
variable_cycle = 0
variable_run = False
gcode = 
	{% set cycle = params.CYCLE|default(30)|int %}
	{% if params.ACTION and params.ACTION|lower == 'start' %}
	{action_respond_info("Hyperlapse: frames started (Cycle %d sec)" % cycle)}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=True
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=cycle VALUE={cycle}
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True
	{% elif params.ACTION and params.ACTION|lower == 'stop' %}
	{% if run %}{action_respond_info("Hyperlapse: frames stopped")}{% endif %}
	SET_GCODE_VARIABLE MACRO=HYPERLAPSE VARIABLE=run VALUE=False
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION=0
	{% else %}
	{action_raise_error("Hyperlapse: No valid input parameter
	Use:
	- HYPERLAPSE ACTION=START [CYCLE=time]
	- HYPERLAPSE ACTION=STOP")}
	{% endif %}

[delayed_gcode _HYPERLAPSE_LOOP]
gcode = 
	UPDATE_DELAYED_GCODE ID=_HYPERLAPSE_LOOP DURATION={printer["gcode_macro HYPERLAPSE"].cycle}
	TIMELAPSE_TAKE_FRAME HYPERLAPSE=True

[gcode_macro TIMELAPSE_RENDER]
description = Render Timelapse video and wait for the result
variable_render = False
variable_run_identifier = 0
gcode = 
	{action_respond_info("Timelapse: Rendering started")}
	{action_call_remote_method("timelapse_render", byrendermacro="True")}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=render VALUE=True
	{printer.configfile.settings['gcode_macro pause'].rename_existing}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5

[delayed_gcode _WAIT_TIMELAPSE_RENDER]
gcode = 
	{% set ri = printer['gcode_macro TIMELAPSE_RENDER'].run_identifier % 4 %}
	SET_GCODE_VARIABLE MACRO=TIMELAPSE_RENDER VARIABLE=run_identifier VALUE={ri + 1}
	{% if printer['gcode_macro TIMELAPSE_RENDER'].render %}
	M117 Rendering {['-','\\\\','|','/'][ri]}
	UPDATE_DELAYED_GCODE ID=_WAIT_TIMELAPSE_RENDER DURATION=0.5
	{% else %}
	{action_respond_info("Timelapse: Rendering finished")}
	M117
	{printer.configfile.settings['gcode_macro resume'].rename_existing}
	{% endif %}

[gcode_macro TEST_STREAM_DELAY]
description = Helper macro to find stream and park delay
gcode = 
	{% set min = printer.toolhead.axis_minimum %}
	{% set max = printer.toolhead.axis_maximum %}
	{% set act = printer.toolhead.position %}
	{% set tl = printer['gcode_macro TIMELAPSE_TAKE_FRAME'] %}
	{% if act.z > 5.0 %}
	G0 X{min.x + 5.0} F{tl.speed.travel|int * 60}
	G0 X{(max.x-min.x)/2}
	G4 P{tl.park.time|float * 1000}
	_TIMELAPSE_NEW_FRAME HYPERLAPSE=FALSE
	G0 X{max.x - 5.0}
	{% else %}
	{action_raise_error("Toolhead z %.3f to low. Please place head above z = 5.0" % act.z)}
	{% endif %}

[gcode_macro PIDcalibrate]
gcode = 
	PID_CALIBRATE HEATER=extruder TARGET=235
	PID_CALIBRATE HEATER=heater_bed TARGET=80

[gcode_macro POWER_OFF_PRINTER]
gcode = 
	{action_call_remote_method( "set_device_power", device="printer_plug", state="off")}

[gcode_macro START_PRINT]
gcode = 
	{% set BED_TEMP = params.BED_TEMP|default(60)|float %}
	
	{% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(190)|float %}
	
	M140 S{BED_TEMP}
	
	G90
	
	G28
	
	G1 Z5 F3000
	BED_MESH_PROFILE LOAD=default
	
	M190 S{BED_TEMP}
	
	M109 S{EXTRUDER_TEMP}
	M117 Purge extruder
	G1 X25 Y20 Z0.3 F5000.0
	G1 X25 Y175.0 Z0.3 F1500.0 E15
	G1 X25 Y175.0 Z0.4 F5000.0
	G1 X25 Y20 Z0.4 F1500.0 E30
	G92 E0
	G1 Z1.0 F3000

[gcode_macro END_PRINT]
gcode = 
	
	M140 S0
	M104 S0
	
	M106 S0
	
	G91
	G1 X-2 Y-2 E-3 F300
	
	G1 Z10 F3000
	G90
	
	M84
	BED_MESH_CLEAR

[gcode_macro CALCULATE_BED_MESH]
description = Calculate bed_mesh boundaries automatically based on your bltouch/probe config
gcode = 
	{% set BED_MESH_MARGIN = params.BED_MESH_MARGIN|default(10)|float %}
	
	{% set X_MAX = printer.toolhead.axis_maximum.x|default(230)|float %}
	{% set Y_MAX = printer.toolhead.axis_maximum.y|default(230)|float %}
	
	{% set X_OFFSET = 0.0 |float %}
	{% set Y_OFFSET = 0.0 |float %}
	
	{% if printer.configfile.config["bltouch"] is defined %}
	{% set X_OFFSET = (printer.configfile.settings.bltouch.x_offset if printer.configfile.settings.bltouch.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.settings.bltouch.y_offset if printer.configfile.settings.bltouch.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	{% if printer.configfile.config["probe"] is defined %}
	{% set X_OFFSET = (printer.configfile.config.probe.x_offset if printer.configfile.config.probe.x_offset is defined else X_OFFSET)|float %}
	{% set Y_OFFSET = (printer.configfile.config.probe.y_offset if printer.configfile.config.probe.y_offset is defined else Y_OFFSET)|float %}
	{% endif %}
	
	
	
	{% set BED_MESH_MIN_X = BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MIN_Y = BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_OFFSET + BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_X = X_MAX - (X_OFFSET)|abs - BED_MESH_MARGIN if X_OFFSET <= 0.0 else X_MAX - BED_MESH_MARGIN |float %}
	{% set BED_MESH_MAX_Y = Y_MAX - (Y_OFFSET)|abs - BED_MESH_MARGIN if Y_OFFSET <= 0.0 else Y_MAX - BED_MESH_MARGIN |float %}
	
	
	{action_respond_info("BED_MESH_MARGIN : %f" % (BED_MESH_MARGIN))}
	{action_respond_info("X_MAX           : %f" % (X_MAX))}
	{action_respond_info("Y_MAX           : %f" % (Y_MAX))}
	{action_respond_info("X_OFFSET        : %f" % (X_OFFSET))}
	{action_respond_info("Y_OFFSET        : %f" % (Y_OFFSET))}
	{action_respond_info("BED_MESH_MIN_X  : %f" % (BED_MESH_MIN_X))}
	{action_respond_info("BED_MESH_MIN_Y  : %f" % (BED_MESH_MIN_Y))}
	{action_respond_info("BED_MESH_MAX_X  : %f" % (BED_MESH_MAX_X))}
	{action_respond_info("BED_MESH_MAX_Y  : %f" % (BED_MESH_MAX_Y))}
	{action_respond_info("--- VALUES TO ADD OR UPDATE TO OUR BED_MESH VALUES ---")}
	{action_respond_info("--- VALORES PARA AGREGAR O ACTUALIZAR EN NUESTRA SECCIÓN BED_MESH ---")}
	{action_respond_info("mesh_max: %s,%s" % (BED_MESH_MAX_X,BED_MESH_MAX_Y))}
	{action_respond_info("mesh_min: %s,%s" % (BED_MESH_MIN_X,BED_MESH_MIN_Y))}

[gcode_macro PID_EXTRUDER]
description = PID Tune for the Extruder
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set T = params.TEMPERATURE|default(210)|float %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set P = printer.configfile.config[e].pid_kp|float %}
	{% set I = printer.configfile.config[e].pid_ki|float %}
	{% set D = printer.configfile.config[e].pid_kd|float %}
	M118 Homing...
	G28
	M106 S{S}
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Extruder PID calibration...
	PID_CALIBRATE HEATER={e} TARGET={T}
	TURN_OFF_HEATERS
	M107
	SAVE_CONFIG

[gcode_macro PID_BED]
description = PID Tune for the Bed
gcode = 
	{% set T = params.TEMPERATURE|default(60)|float %}
	{% set P = printer.configfile.config['heater_bed'].pid_kp|float %}
	{% set I = printer.configfile.config['heater_bed'].pid_ki|float %}
	{% set D = printer.configfile.config['heater_bed'].pid_kd|float %}
	M118 Homing...
	G28
	M118 // PID parameters: pid_Kp={P} pid_Ki={I} pid_Kd={D}  (old)
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={T}
	TURN_OFF_HEATERS
	SAVE_CONFIG

[gcode_macro PID_ALL]
description = Heater and Bed temperature calibration. Usage: PID_ALL [TE=temperature] [TB=temperature]\\n Calibra la temperatura del extrusor y la cama. Uso: PID_ALL [TE=temperatura] [TB=temperature]
gcode = 
	{% set e = printer.toolhead.extruder %}
	{% set S = params.FAN_IN_PERCENT|default(100)|float *2.55 %}
	{% set TE = params.TE|default(195)|int %}
	{% set TB = params.TB|default(45)|int %}
	M118 Homing...
	G28
	M118 Extruder PID calibration...
	M106 S{S}
	PID_CALIBRATE HEATER={e} TARGET={TE}
	M107
	M118 Bed PID calibration...
	PID_CALIBRATE HEATER=heater_bed TARGET={TB}
	SAVE_CONFIG

[tmc2209 stepper_x]
uart_pin = PE6
run_current = 0.9
diag_pin = ^PA15
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_y]
uart_pin = PE3
run_current = 0.9
diag_pin = ^PD2
interpolate = false
driver_sgthrs = 100
stealthchop_threshold = 0

[tmc2209 stepper_z]
uart_pin = PB7
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 stepper_z1]
uart_pin = PD4
run_current = 0.9
diag_pin = 
stealthchop_threshold = 0

[tmc2209 extruder]
uart_pin = PB3
run_current = 0.842
diag_pin = 
stealthchop_threshold = 0

[mcu eddy]
serial = /dev/serial/by-id/usb-Klipper_rp2040_5044505930740C1C-if00
restart_method = command

[temperature_sensor btt_eddy_mcu]
sensor_type = temperature_mcu
sensor_mcu = eddy
min_temp = 10
max_temp = 100

[probe_eddy_current btt_eddy]
sensor_type = ldc1612
z_offset = 2.5
i2c_mcu = eddy
i2c_bus = i2c0f
x_offset = -30
y_offset = 5
reg_drive_current = 16
calibrate = 
	0.050188:3205933.097,0.090337:3205145.727,0.130487:3204354.163,
	0.169383:3203615.123,0.209533:3202860.267,0.249683:3202120.825,
	0.289833:3201389.932,0.329983:3200675.781,0.370133:3199937.342,
	0.410283:3199271.075,0.450433:3198562.823,0.490583:3197906.664,
	0.529478:3197264.891,0.569628:3196643.334,0.609778:3195982.110,
	0.649928:3195394.352,0.690078:3194737.336,0.730228:3194161.411,
	0.770378:3193564.178,0.810528:3192980.830,0.849423:3192409.769,
	0.889573:3191874.493,0.929723:3191327.866,0.969873:3190787.673,
	1.010023:3190232.313,1.050173:3189727.474,1.090323:3189210.067,
	1.130473:3188739.481,1.170623:3188237.257,1.209519:3187753.422,
	1.249669:3187291.436,1.289819:3186821.547,1.329969:3186360.473,
	1.370119:3185924.800,1.410269:3185491.381,1.450419:3185053.330,
	1.490569:3184594.190,1.529464:3184205.277,1.569614:3183785.498,
	1.609764:3183350.340,1.649914:3182966.762,1.690064:3182588.711,
	1.730214:3182190.755,1.770364:3181813.670,1.810514:3181420.036,
	1.849409:3181087.634,1.889559:3180703.858,1.929709:3180363.438,
	1.969859:3180003.082,2.010009:3179664.903,2.050159:3179332.781,
	2.090309:3178990.508,2.130459:3178673.256,2.170609:3178345.224,
	2.209505:3178050.416,2.249655:3177734.057,2.289805:3177419.463,
	2.329955:3177136.203,2.370105:3176837.527,2.410255:3176546.139,
	2.450405:3176268.706,2.490555:3175972.146,2.529450:3175723.811,
	2.569600:3175470.080,2.609750:3175223.081,2.649900:3174962.842,
	2.690050:3174704.198,2.730200:3174460.913,2.770350:3174228.920,
	2.810500:3173989.118,2.849395:3173761.350,2.889545:3173516.616,
	2.929695:3173309.604,2.969845:3173089.770,3.009995:3172877.982,
	3.050145:3172644.639,3.090295:3172452.377,3.130445:3172252.422,
	3.170595:3172031.650,3.209491:3171857.260,3.249641:3171650.997,
	3.289791:3171441.897,3.329941:3171248.522,3.370091:3171071.032,
	3.410241:3170902.167,3.450391:3170700.892,3.490541:3170509.888,
	3.529436:3170367.070,3.569586:3170188.460,3.609736:3170015.379,
	3.649886:3169825.355,3.690036:3169687.899,3.730186:3169514.422,
	3.770336:3169378.249,3.810486:3169199.096,3.849381:3169055.600,
	3.889531:3168906.908,3.929681:3168770.855,3.969831:3168587.431,
	4.009981:3168461.835,4.050131:3168313.942

[temperature_probe btt_eddy]
sensor_type = Generic 3950
sensor_pin = eddy:gpio26
horizontal_move_z = 2
calibration_temp = 29.941653
drift_calibration = 
	3322659.134314, -5564.540372, 60.398093
	3204466.582019, -381.239579, 3.440192
	3191594.449302, -119.470102, 1.125202
	3183159.664481, 17.721542, -0.153070
	3176791.037916, 107.407930, -0.957123
	3171474.720102, 190.159212, -1.751515
	3166582.715676, 281.955770, -2.675074
	3163316.106670, 318.670366, -2.988620
	3160957.710763, 338.412885, -3.164299
drift_calibration_min_temp = 33.83103284492943

[bed_mesh]
speed = 50
horizontal_move_z = 1
mesh_min = 50,60
mesh_max = 280, 310
probe_count = 9, 9
mesh_pps = 3, 3
algorithm = bicubic
bicubic_tension = 0.2

[safe_z_home]
home_xy_position = 204, 185
speed = 50
z_hop = 10
z_hop_speed = 10

[save_variables]
filename = ~/printer_data/config/variables.cfg

[force_move]
enable_force_move = True

[delayed_gcode RESTORE_PROBE_OFFSET]
initial_duration = 1.
gcode = 
	{% set svv = printer.save_variables.variables %}
	{% if not printer["gcode_macro SET_GCODE_OFFSET"].restored %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ svv.nvm_offset|default(0) }
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=restored VALUE=True
	{% endif %}

[gcode_macro G28]
rename_existing = G28.1
gcode = 
	
	G28.1 {rawparams}
	{% if not rawparams or (rawparams and 'Z' in rawparams) %}
	PROBE
	SET_Z_FROM_PROBE
	{% endif %}

[gcode_macro SET_Z_FROM_PROBE]
gcode = 
	{% set cf = printer.configfile.settings %}
	SET_GCODE_OFFSET_ORIG Z={printer.probe.last_z_result - cf['probe_eddy_current btt_eddy'].z_offset + printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset}
	G90
	G1 Z{cf.safe_z_home.z_hop}

[gcode_macro Z_OFFSET_APPLY_PROBE]
rename_existing = Z_OFFSET_APPLY_PROBE_ORIG
gcode = 
	SAVE_VARIABLE VARIABLE=nvm_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset }

[gcode_macro SET_GCODE_OFFSET]
rename_existing = SET_GCODE_OFFSET_ORIG
variable_restored = False
variable_runtime_offset = 0
gcode = 
	{% if params.Z_ADJUST %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE={ printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset + params.Z_ADJUST|float }
	{% endif %}
	{% if params.Z %}
	{% set paramList = rawparams.split() %}
	{% for i in range(paramList|length) %}
	{% if paramList[i]=="Z=0" %}
	{% set temp=paramList.pop(i) %}
	{% set temp="Z_ADJUST=" + (-printer["gcode_macro SET_GCODE_OFFSET"].runtime_offset)|string %}
	{% if paramList.append(temp) %}{% endif %}
	{% endif %}
	{% endfor %}
	{% set rawparams=paramList|join(' ') %}
	SET_GCODE_VARIABLE MACRO=SET_GCODE_OFFSET VARIABLE=runtime_offset VALUE=0
	{% endif %}
	SET_GCODE_OFFSET_ORIG { rawparams }

[gcode_macro PROBE_EDDY_CURRENT_CALIBRATE_AUTO]
gcode = 
	BED_MESH_CLEAR
	G28 X Y
	G90
	G1 X{ printer.toolhead.axis_maximum.x/2 } Y{ printer.toolhead.axis_maximum.y/2 } F6000
	{% if 'z' not in printer.toolhead.homed_axes %}
	SET_KINEMATIC_POSITION Z={ printer.toolhead.axis_maximum.z-1 }
	{% endif %}
	PROBE_EDDY_CURRENT_CALIBRATE {rawparams}

[mcu]
serial = /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00

[stepper_x]
step_pin = PC14
dir_pin = !PC13
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA14
position_endstop = 0
position_min = 0
position_max = 330
homing_speed = 50

[stepper_y]
step_pin = PE5
dir_pin = PE4
enable_pin = !PC15
microsteps = 32
rotation_distance = 39.9
endstop_pin = !PA15
position_endstop = 0
position_min = 0
position_max = 320
homing_speed = 50

[stepper_z1]
step_pin = PE1
dir_pin = PE0
enable_pin = !PE2
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop

[stepper_z]
step_pin = PD6
dir_pin = PD5
enable_pin = !PD7
microsteps = 32
rotation_distance = 8.03
endstop_pin = probe:z_virtual_endstop
position_max = 400
position_min = -5
homing_speed = 10

[screws_tilt_adjust]
screw1 = 204,185
screw1_name = Central screw
screw2 = 105,84
screw2_name = Front left screw
screw3 = 305,84
screw3_name = Rear left screw
screw4 = 305,284
screw4_name = Front right screw
screw5 = 105, 284
screw5_name = Rear right screw
horizontal_move_z = 10
speed = 100
screw_thread = CW-M3

[bed_screws]
screw1 = 50,70
screw2 = 250,70
screw3 = 250, 230
screw4 = 50, 230

[z_tilt]
z_positions = -60, 155
	330, 155
points = 70, 184
	300, 184
speed = 100
horizontal_move_z = 10
retries = 8
retry_tolerance = 0.005

[extruder]
step_pin = PB5
dir_pin = !PB4
enable_pin = !PB6
microsteps = 16
rotation_distance = 8.06
nozzle_diameter = 0.400
filament_diameter = 1.750
heater_pin = PB1
sensor_type = ATC Semitec 104GT-2
sensor_pin = PC1
max_extrude_only_distance = 100000
min_temp = 0
max_temp = 260
pressure_advance = 0.08
control = pid
pid_kp = 39.588
pid_ki = 7.762
pid_kd = 50.475

[heater_bed]
heater_pin = PB10
sensor_type = ATC Semitec 104NT-4-R025H42G
sensor_pin = PC0
min_temp = 0
max_temp = 130
control = pid
pid_kp = 57.129
pid_ki = 2.026
pid_kd = 402.756
x_count = 4
y_count = 4
mesh_x_pps = 2
mesh_y_pps = 2
algo = bicubic
tension = 0.2
min_x = 40.0
max_x = 256.0
min_y = 60.0
max_y = 279.98999999999995

[fan]
pin = PA2
max_power = 1.0
off_below = 0.1

[heater_fan hotend]
pin = PA0
heater = extruder
heater_temp = 50.0
fan_speed = 1.0
shutdown_speed = 1.0

[printer]
kinematics = cartesian
max_velocity = 250
max_accel = 4500
max_z_velocity = 25
max_z_accel = 100

[skew_correction]

[bed_mesh default]
version = 1
points = 
	0.077380, 0.111423, 0.114676, 0.156457, 0.174093, 0.168682, 0.150091, 0.125241, 0.144394
	0.019770, 0.035236, 0.040041, 0.064163, 0.097841, 0.072235, 0.036121, 0.038328, -0.022320
	-0.046588, -0.004041, -0.002183, 0.034924, 0.056260, 0.057109, 0.025641, -0.003699, 0.000421
	-0.014058, -0.015146, -0.014967, 0.007296, 0.033845, 0.025323, -0.004179, -0.028621, -0.045631
	-0.053217, -0.062006, -0.048567, -0.019670, -0.003835, 0.000873, -0.021848, -0.046722, -0.038119
	-0.082454, -0.064824, -0.071665, -0.049962, -0.027577, -0.036043, -0.056768, -0.072205, -0.063067
	0.026282, -0.006652, -0.015925, 0.013883, 0.040249, 0.050473, 0.018200, -0.017486, -0.044483
	0.006865, 0.029730, 0.028595, 0.044249, 0.088176, 0.080421, 0.046590, 0.046284, 0.075516
	0.059874, -0.031578, -0.021740, 0.006004, 0.063576, 0.092164, 0.028281, -0.012436, -0.035619
x_count = 9
y_count = 9
mesh_x_pps = 3
mesh_y_pps = 3
algo = bicubic
tension = 0.2
min_x = 50.0
max_x = 280.0
min_y = 60.0
max_y = 310.0

[skew_correction mi_skew]
xy_skew = -0.00679190845337054
xz_skew = 0.0
yz_skew = 0.0
=======================
temperature_probe btt_eddy: loaded temperature drift calibration. Min Temp: 33.83, Min Freq: 3156001.351363
y(x) = 60.398093x^2 - 5564.540372x + 3322659.134314
y(x) = 3.440192x^2 - 381.239579x + 3204466.582019
y(x) = 1.125202x^2 - 119.470102x + 3191594.449302
y(x) = -0.153070x^2 + 17.721542x + 3183159.664481
y(x) = -0.957123x^2 + 107.407930x + 3176791.037916
y(x) = -1.751515x^2 + 190.159212x + 3171474.720102
y(x) = -2.675074x^2 + 281.955770x + 3166582.715676
y(x) = -2.988620x^2 + 318.670366x + 3163316.106670
y(x) = -3.164299x^2 + 338.412885x + 3160957.710763
temperature_probe btt_eddy: registered drift compensation with probe [probe_eddy_current btt_eddy]
Extruder max_extrude_ratio=0.266081
mcu 'mcu': Starting serial connect
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
webhooks client 547916652880: New connection
webhooks client 547916652880: Client info {'program': 'Moonraker', 'version': 'v0.9.3-120-g5836eab'}
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
mcu 'mcu': Unable to open serial port: [Errno 2] could not open port /dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00: [Errno 2] No such file or directory: '/dev/serial/by-id/usb-Klipper_stm32f407xx_3F002B001550335330363820-if00'
`,
    moonraker: `-------------------- Log Start | Thu Jan  8 03:09:59 2026 --------------------
platform: Linux-6.12.47+rpt-rpi-v8-aarch64-with-glibc2.36
data_path: /home/luis/printer_data
is_default_data_path: False
config_file: /home/luis/printer_data/config/moonraker.conf
backup_config: None
startup_warnings: []
verbose: False
debug: False
asyncio_debug: False
is_backup_config: False
is_python_package: True
instance_uuid: 3f5c60401f1a4b94a107f77b27ae0653
unix_socket_path: /home/luis/printer_data/comms/moonraker.sock
structured_logging: False
software_version: v0.9.3-120-g5836eab
git_branch: master
git_remote: origin
git_repo_url: https://github.com/Arksine/moonraker.git
modified_files: []
unofficial_components: []
log_file: /home/luis/printer_data/logs/moonraker.log
python_version: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]
launch_args: /home/luis/moonraker-env/bin/python /home/luis/moonraker/moonraker/__main__.py
msgspec_enabled: True
uvloop_enabled: True
2026-01-08 03:09:59,105 [confighelper.py:read_file()] - Configuration File '/home/luis/printer_data/config/moonraker.conf' parsed, total size: 2192 B
2026-01-08 03:09:59,106 [server.py:add_log_rollover_item()] - 
#################### Moonraker Configuration ####################

[server]
host = 0.0.0.0
port = 7125
max_upload_size = 1024
klippy_uds_address = ~/printer_data/comms/klippy.sock

[file_manager]
enable_object_processing = False

[authorization]
cors_domains = 
	https://my.mainsail.xyz
	http://my.mainsail.xyz
	http://*.local
	http://*.lan
trusted_clients = 
	10.0.0.0/8
	127.0.0.0/8
	169.254.0.0/16
	172.16.0.0/12
	192.168.0.0/16
	FE80::/10
	::1/128

[octoprint_compat]

[history]

[announcements]
subscriptions = 
	mainsail

[update_manager]
refresh_interval = 168
enable_auto_refresh = True

[update_manager mainsail]
type = web
channel = stable
repo = mainsail-crew/mainsail
path = ~/mainsail

[update_manager mainsail-config]
type = git_repo
primary_branch = master
path = ~/mainsail-config
origin = https://github.com/mainsail-crew/mainsail-config.git
managed_services = klipper

[update_manager crowsnest]
type = git_repo
path = ~/crowsnest
origin = https://github.com/mainsail-crew/crowsnest.git
managed_services = crowsnest
install_script = tools/pkglist.sh

[update_manager sonar]
type = git_repo
path = ~/sonar
origin = https://github.com/mainsail-crew/sonar.git
primary_branch = main
managed_services = sonar
system_dependencies = resources/system-dependencies.json

#################################################################
All Configuration Files:
/home/luis/printer_data/config/moonraker.conf
#################################################################
2026-01-08 03:09:59,913 [server.py:load_component()] - Component (secrets) loaded
2026-01-08 03:09:59,957 [server.py:load_component()] - Component (template) loaded
2026-01-08 03:10:00,250 [server.py:load_component()] - Component (klippy_connection) loaded
2026-01-08 03:10:04,071 [application.py:__init__()] - Detected Tornado Version 6.5.1
2026-01-08 03:10:04,074 [server.py:load_component()] - Component (application) loaded
2026-01-08 03:10:04,246 [server.py:load_component()] - Component (websockets) loaded
2026-01-08 03:10:04,705 [server.py:add_log_rollover_item()] - Loading Sqlite database provider. Sqlite Version: 3.40.1
2026-01-08 03:10:04,957 [server.py:add_log_rollover_item()] - Created default SQL table namespace_store
2026-01-08 03:10:05,033 [server.py:add_log_rollover_item()] - Unsafe Shutdown Count: 0
2026-01-08 03:10:05,116 [server.py:load_component()] - Component (database) loaded
2026-01-08 03:10:05,471 [server.py:load_component()] - Component (dbus_manager) loaded
2026-01-08 03:10:06,023 [file_manager.py:__init__()] - Using File System Observer: inotify
2026-01-08 03:10:06,132 [server.py:load_component()] - Component (file_manager) loaded
2026-01-08 03:10:06,238 [database.py:register_table()] - Creating table authorized_users...
2026-01-08 03:10:06,429 [authorization.py:__init__()] - Authorization Configuration Loaded
Trusted Clients:
10.0.0.0/8
127.0.0.0/8
169.254.0.0/16
172.16.0.0/12
192.168.0.0/16
fe80::/10
::1/128
CORS Domains:
https://my\\.mainsail\\.xyz
http://my\\.mainsail\\.xyz
http://.*\\.local
http://.*\\.lan
2026-01-08 03:10:06,434 [server.py:load_component()] - Component (authorization) loaded
2026-01-08 03:10:06,452 [server.py:load_component()] - Component (klippy_apis) loaded
2026-01-08 03:10:07,253 [server.py:add_log_rollover_item()] - 
System Info:

***python***
  version: (3, 11, 2, 'final', 0)
  version_string: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]

***cpu_info***
  cpu_count: 4
  bits: 64bit
  processor: aarch64
  cpu_desc: 
  serial_number: 272b6098
  hardware_desc: 
  model: Raspberry Pi 3 Model B Plus Rev 1.3
  total_memory: 876816
  memory_units: kB

***sd_info***
  manufacturer_id: 00
  manufacturer: Unknown
  oem_id: 0000
  product_name: USD  
  product_revision: 2.0
  serial_number: 000002f8
  manufacturer_date: 5/2023
  capacity: 59.5 GiB
  total_bytes: 63908610048

***distribution***
  name: Debian GNU/Linux 12 (bookworm)
  id: debian
  version: 12
  version_parts: {'major': '12', 'minor': '', 'build_number': ''}
  like: 
  codename: bookworm
  release_info: {'name': 'MainsailOS', 'version_id': '2.2.2', 'codename': 'bookworm', 'id': 'mainsailos'}
  kernel_version: 6.12.47+rpt-rpi-v8

***virtualization***
  virt_type: none
  virt_identifier: none

***network***

***canbus***

***Allowed Services***
  klipper_mcu
  webcamd
  MoonCord
  KlipperScreen
  moonraker-telegram-bot
  moonraker-obico
  sonar
  crowsnest
  octoeverywhere
  ratos-configurator
2026-01-08 03:10:07,273 [server.py:load_component()] - Component (shell_command) loaded
2026-01-08 03:10:07,274 [machine.py:__init__()] - Using System Provider: systemd_dbus
2026-01-08 03:10:07,547 [server.py:add_log_rollover_item()] - Found libcamera Python module, version: v0.5.2+99-bfd68f78
2026-01-08 03:10:07,547 [server.py:load_component()] - Component (machine) loaded
2026-01-08 03:10:07,559 [server.py:load_component()] - Component (data_store) loaded
2026-01-08 03:10:07,580 [proc_stats.py:__init__()] - Detected 'vcgencmd', throttle checking enabled
2026-01-08 03:10:07,581 [proc_stats.py:_get_cpu_thermal_file()] - Monitoring temperature for Raspberry Pi CPU
2026-01-08 03:10:07,583 [server.py:load_component()] - Component (proc_stats) loaded
2026-01-08 03:10:07,590 [server.py:load_component()] - Component (job_state) loaded
2026-01-08 03:10:07,609 [server.py:load_component()] - Component (job_queue) loaded
2026-01-08 03:10:07,651 [database.py:register_table()] - Creating table job_history...
2026-01-08 03:10:07,919 [database.py:register_table()] - Creating table job_totals...
2026-01-08 03:10:07,950 [history.py:migrate()] - Migrating history totals from moonraker namespace...
2026-01-08 03:10:07,999 [server.py:load_component()] - Component (history) loaded
2026-01-08 03:10:08,049 [server.py:load_component()] - Component (http_client) loaded
2026-01-08 03:10:08,197 [server.py:load_component()] - Component (announcements) loaded
2026-01-08 03:10:08,224 [server.py:load_component()] - Component (webcam) loaded
2026-01-08 03:10:08,239 [server.py:load_component()] - Component (extensions) loaded
2026-01-08 03:10:08,261 [server.py:load_component()] - Component (octoprint_compat) loaded
2026-01-08 03:10:08,612 [base_deploy.py:log_info()] - Git Repo moonraker: Detected virtualenv: /home/luis/moonraker-env
2026-01-08 03:10:08,617 [base_deploy.py:log_info()] - Git Repo klipper: Detected virtualenv: /home/luis/klippy-env
2026-01-08 03:10:08,637 [server.py:load_component()] - Component (update_manager) loaded
2026-01-08 03:10:08,638 [server.py:_initialize_component()] - Performing Component Post Init: [database]
2026-01-08 03:10:08,668 [server.py:_initialize_component()] - Performing Component Post Init: [dbus_manager]
2026-01-08 03:10:08,680 [server.py:_initialize_component()] - Performing Component Post Init: [authorization]
2026-01-08 03:10:08,682 [server.py:_initialize_component()] - Performing Component Post Init: [machine]
2026-01-08 03:10:08,685 [machine.py:update_usb_ids()] - Fetching latest usb.ids file...
2026-01-08 03:10:08,715 [machine.py:validation_init()] - Installation version in database up to date
2026-01-08 03:10:09,411 [machine.py:check_virt_status()] - No Virtualization Detected
2026-01-08 03:10:09,562 [machine.py:_find_public_ip()] - Detected Local IP: 10.160.210.74
2026-01-08 03:10:09,565 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 03:10:09,640 [server.py:add_log_rollover_item()] - 
Systemd unit moonraker.service:
unit_name: moonraker.service
is_default: True
manager: systemd
Properties:
**Requires=['sysinit.target', 'network-online.target', 'system.slice']
**After=['basic.target', 'network-online.target', 'system.slice', 'klipper.service', 'systemd-journald.socket', 'sysinit.target']
**SupplementaryGroups=['moonraker-admin']
**EnvironmentFiles=/home/luis/printer_data/systemd/moonraker.env
**ExecStart=/home/luis/moonraker-env/bin/python $MOONRAKER_ARGS
**WorkingDirectory=
**FragmentPath=/etc/systemd/system/moonraker.service
**Description=API Server for Klipper SV1
**User=luis
2026-01-08 03:10:09,640 [server.py:_initialize_component()] - Performing Component Post Init: [proc_stats]
2026-01-08 03:10:09,640 [server.py:_initialize_component()] - Performing Component Post Init: [history]
2026-01-08 03:10:09,648 [server.py:_initialize_component()] - Performing Component Post Init: [announcements]
2026-01-08 03:10:09,658 [server.py:_initialize_component()] - Performing Component Post Init: [webcam]
2026-01-08 03:10:09,658 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 03:10:09,681 [server.py:_initialize_component()] - Performing Component Post Init: [klippy_connection]
2026-01-08 03:10:09,681 [server.py:_initialize_component()] - Performing Component Post Init: [update_manager]
2026-01-08 03:10:10,595 [machine.py:update_usb_ids()] - Writing usb.ids file...
2026-01-08 03:10:11,053 [base_deploy.py:log_info()] - PackageDeploy: PackageKit Provider Configured
2026-01-08 03:10:11,105 [confighelper.py:create_backup()] - Backing up last working configuration to '/home/luis/printer_data/config/.moonraker.conf.bkp'
2026-01-08 03:10:11,113 [extensions.py:start_unix_server()] - Creating Unix Domain Socket at '/home/luis/printer_data/comms/moonraker.sock'
2026-01-08 03:10:11,114 [server.py:start_server()] - Starting Moonraker on (0.0.0.0, 7125), Hostname: mainsailos
2026-01-08 03:10:11,120 [application.py:listen()] - SSL Certificate/Key not configured, aborting HTTPS Server startup
2026-01-08 03:10:27,838 [server.py:_handle_term_signal()] - Exiting with signal SIGTERM
2026-01-08 03:10:28,181 [server.py:main()] - Server Shutdown
-------------------- Log Start | Thu Jan  8 03:10:49 2026 --------------------
platform: Linux-6.12.47+rpt-rpi-v8-aarch64-with-glibc2.36
data_path: /home/luis/printer_data
is_default_data_path: False
config_file: /home/luis/printer_data/config/moonraker.conf
backup_config: /home/luis/printer_data/config/.moonraker.conf.bkp
startup_warnings: []
verbose: False
debug: False
asyncio_debug: False
is_backup_config: False
is_python_package: True
instance_uuid: 3f5c60401f1a4b94a107f77b27ae0653
unix_socket_path: /home/luis/printer_data/comms/moonraker.sock
structured_logging: False
software_version: v0.9.3-120-g5836eab
git_branch: master
git_remote: origin
git_repo_url: https://github.com/Arksine/moonraker.git
modified_files: []
unofficial_components: []
log_file: /home/luis/printer_data/logs/moonraker.log
python_version: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]
launch_args: /home/luis/moonraker-env/bin/python /home/luis/moonraker/moonraker/__main__.py
msgspec_enabled: True
uvloop_enabled: True
2026-01-08 03:10:49,319 [confighelper.py:read_file()] - Configuration File '/home/luis/printer_data/config/moonraker.conf' parsed, total size: 2192 B
2026-01-08 03:10:49,320 [server.py:add_log_rollover_item()] - 
#################### Moonraker Configuration ####################

[server]
host = 0.0.0.0
port = 7125
max_upload_size = 1024
klippy_uds_address = ~/printer_data/comms/klippy.sock

[file_manager]
enable_object_processing = False

[authorization]
cors_domains = 
	https://my.mainsail.xyz
	http://my.mainsail.xyz
	http://*.local
	http://*.lan
trusted_clients = 
	10.0.0.0/8
	127.0.0.0/8
	169.254.0.0/16
	172.16.0.0/12
	192.168.0.0/16
	FE80::/10
	::1/128

[octoprint_compat]

[history]

[announcements]
subscriptions = 
	mainsail

[update_manager]
refresh_interval = 168
enable_auto_refresh = True

[update_manager mainsail]
type = web
channel = stable
repo = mainsail-crew/mainsail
path = ~/mainsail

[update_manager mainsail-config]
type = git_repo
primary_branch = master
path = ~/mainsail-config
origin = https://github.com/mainsail-crew/mainsail-config.git
managed_services = klipper

[update_manager crowsnest]
type = git_repo
path = ~/crowsnest
origin = https://github.com/mainsail-crew/crowsnest.git
managed_services = crowsnest
install_script = tools/pkglist.sh

[update_manager sonar]
type = git_repo
path = ~/sonar
origin = https://github.com/mainsail-crew/sonar.git
primary_branch = main
managed_services = sonar
system_dependencies = resources/system-dependencies.json

#################################################################
All Configuration Files:
/home/luis/printer_data/config/moonraker.conf
#################################################################
2026-01-08 03:10:49,935 [server.py:load_component()] - Component (secrets) loaded
2026-01-08 03:10:49,975 [server.py:load_component()] - Component (template) loaded
2026-01-08 03:10:49,985 [server.py:load_component()] - Component (klippy_connection) loaded
2026-01-08 03:10:54,303 [application.py:__init__()] - Detected Tornado Version 6.5.1
2026-01-08 03:10:54,306 [server.py:load_component()] - Component (application) loaded
2026-01-08 03:10:54,428 [server.py:load_component()] - Component (websockets) loaded
2026-01-08 03:10:55,075 [server.py:add_log_rollover_item()] - Loading Sqlite database provider. Sqlite Version: 3.40.1
2026-01-08 03:10:55,113 [server.py:add_log_rollover_item()] - Unsafe Shutdown Count: 0
2026-01-08 03:10:55,117 [server.py:load_component()] - Component (database) loaded
2026-01-08 03:10:55,964 [server.py:load_component()] - Component (dbus_manager) loaded
2026-01-08 03:10:56,160 [file_manager.py:__init__()] - Using File System Observer: inotify
2026-01-08 03:10:56,331 [server.py:load_component()] - Component (file_manager) loaded
2026-01-08 03:10:56,451 [database.py:register_table()] - Found registered table authorized_users
2026-01-08 03:10:56,454 [authorization.py:__init__()] - Authorization Configuration Loaded
Trusted Clients:
10.0.0.0/8
127.0.0.0/8
169.254.0.0/16
172.16.0.0/12
192.168.0.0/16
fe80::/10
::1/128
CORS Domains:
https://my\\.mainsail\\.xyz
http://my\\.mainsail\\.xyz
http://.*\\.local
http://.*\\.lan
2026-01-08 03:10:56,459 [server.py:load_component()] - Component (authorization) loaded
2026-01-08 03:10:56,477 [server.py:load_component()] - Component (klippy_apis) loaded
2026-01-08 03:10:57,186 [server.py:add_log_rollover_item()] - 
System Info:

***python***
  version: (3, 11, 2, 'final', 0)
  version_string: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]

***cpu_info***
  cpu_count: 4
  bits: 64bit
  processor: aarch64
  cpu_desc: 
  serial_number: 272b6098
  hardware_desc: 
  model: Raspberry Pi 3 Model B Plus Rev 1.3
  total_memory: 876816
  memory_units: kB

***sd_info***
  manufacturer_id: 00
  manufacturer: Unknown
  oem_id: 0000
  product_name: USD  
  product_revision: 2.0
  serial_number: 000002f8
  manufacturer_date: 5/2023
  capacity: 59.5 GiB
  total_bytes: 63908610048

***distribution***
  name: Debian GNU/Linux 12 (bookworm)
  id: debian
  version: 12
  version_parts: {'major': '12', 'minor': '', 'build_number': ''}
  like: 
  codename: bookworm
  release_info: {'name': 'MainsailOS', 'version_id': '2.2.2', 'codename': 'bookworm', 'id': 'mainsailos'}
  kernel_version: 6.12.47+rpt-rpi-v8

***virtualization***
  virt_type: none
  virt_identifier: none

***network***

***canbus***

***Allowed Services***
  klipper_mcu
  webcamd
  MoonCord
  KlipperScreen
  moonraker-telegram-bot
  moonraker-obico
  sonar
  crowsnest
  octoeverywhere
  ratos-configurator
2026-01-08 03:10:57,393 [server.py:load_component()] - Component (shell_command) loaded
2026-01-08 03:10:57,393 [machine.py:__init__()] - Using System Provider: systemd_dbus
2026-01-08 03:10:57,682 [server.py:add_log_rollover_item()] - Found libcamera Python module, version: v0.5.2+99-bfd68f78
2026-01-08 03:10:57,683 [server.py:load_component()] - Component (machine) loaded
2026-01-08 03:10:57,710 [server.py:load_component()] - Component (data_store) loaded
2026-01-08 03:10:57,735 [proc_stats.py:__init__()] - Detected 'vcgencmd', throttle checking enabled
2026-01-08 03:10:57,736 [proc_stats.py:_get_cpu_thermal_file()] - Monitoring temperature for Raspberry Pi CPU
2026-01-08 03:10:57,737 [server.py:load_component()] - Component (proc_stats) loaded
2026-01-08 03:10:57,759 [server.py:load_component()] - Component (job_state) loaded
2026-01-08 03:10:57,787 [server.py:load_component()] - Component (job_queue) loaded
2026-01-08 03:10:57,812 [database.py:register_table()] - Found registered table job_history
2026-01-08 03:10:57,812 [database.py:register_table()] - Found registered table job_totals
2026-01-08 03:10:57,815 [server.py:load_component()] - Component (history) loaded
2026-01-08 03:10:57,887 [server.py:load_component()] - Component (http_client) loaded
2026-01-08 03:10:57,897 [server.py:load_component()] - Component (announcements) loaded
2026-01-08 03:10:57,908 [server.py:load_component()] - Component (webcam) loaded
2026-01-08 03:10:57,914 [server.py:load_component()] - Component (extensions) loaded
2026-01-08 03:10:57,924 [server.py:load_component()] - Component (octoprint_compat) loaded
2026-01-08 03:10:58,116 [base_deploy.py:log_info()] - Git Repo moonraker: Detected virtualenv: /home/luis/moonraker-env
2026-01-08 03:10:58,121 [base_deploy.py:log_info()] - Git Repo klipper: Detected virtualenv: /home/luis/klippy-env
2026-01-08 03:10:58,159 [server.py:load_component()] - Component (update_manager) loaded
2026-01-08 03:10:58,160 [server.py:_initialize_component()] - Performing Component Post Init: [database]
2026-01-08 03:10:58,270 [server.py:_initialize_component()] - Performing Component Post Init: [dbus_manager]
2026-01-08 03:10:58,288 [server.py:_initialize_component()] - Performing Component Post Init: [authorization]
2026-01-08 03:10:58,290 [server.py:_initialize_component()] - Performing Component Post Init: [machine]
2026-01-08 03:10:58,295 [machine.py:validation_init()] - Installation version in database up to date
2026-01-08 03:10:59,114 [machine.py:check_virt_status()] - No Virtualization Detected
2026-01-08 03:10:59,303 [machine.py:_find_public_ip()] - Detected Local IP: 10.160.210.74
2026-01-08 03:10:59,306 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 03:10:59,379 [server.py:add_log_rollover_item()] - 
Systemd unit moonraker.service:
unit_name: moonraker.service
is_default: True
manager: systemd
Properties:
**Requires=['network-online.target', 'sysinit.target', 'system.slice']
**After=['system.slice', 'network-online.target', 'klipper.service', 'sysinit.target', 'basic.target', 'systemd-journald.socket']
**SupplementaryGroups=['moonraker-admin']
**EnvironmentFiles=/home/luis/printer_data/systemd/moonraker.env
**ExecStart=/home/luis/moonraker-env/bin/python $MOONRAKER_ARGS
**WorkingDirectory=
**FragmentPath=/etc/systemd/system/moonraker.service
**Description=API Server for Klipper SV1
**User=luis
2026-01-08 03:10:59,380 [server.py:_initialize_component()] - Performing Component Post Init: [proc_stats]
2026-01-08 03:10:59,380 [server.py:_initialize_component()] - Performing Component Post Init: [history]
2026-01-08 03:10:59,388 [server.py:_initialize_component()] - Performing Component Post Init: [announcements]
2026-01-08 03:10:59,416 [server.py:_initialize_component()] - Performing Component Post Init: [webcam]
2026-01-08 03:10:59,417 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 03:10:59,425 [server.py:_initialize_component()] - Performing Component Post Init: [klippy_connection]
2026-01-08 03:10:59,425 [server.py:_initialize_component()] - Performing Component Post Init: [update_manager]
2026-01-08 03:11:00,491 [base_deploy.py:log_info()] - PackageDeploy: PackageKit Provider Configured
2026-01-08 03:11:00,522 [extensions.py:start_unix_server()] - Creating Unix Domain Socket at '/home/luis/printer_data/comms/moonraker.sock'
2026-01-08 03:11:00,523 [server.py:start_server()] - Starting Moonraker on (0.0.0.0, 7125), Hostname: mainsailos
2026-01-08 03:11:00,525 [application.py:listen()] - SSL Certificate/Key not configured, aborting HTTPS Server startup
2026-01-08 03:11:51,571 [base_deploy.py:log_info()] - PackageKit: Detected 0 package updates:

2026-01-08 03:11:51,602 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker status --porcelain -b) successfully finished
2026-01-08 03:11:51,630 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker branch --list --no-color) successfully finished
2026-01-08 03:11:51,674 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker remote get-url origin) successfully finished
2026-01-08 03:12:15,075 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker fetch origin --prune --progress) successfully finished
2026-01-08 03:12:15,308 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker merge-base --is-ancestor HEAD origin/master) successfully finished
2026-01-08 03:12:15,333 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker rev-parse HEAD) successfully finished
2026-01-08 03:12:15,372 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker describe --always --tags --long --dirty --abbrev=8) successfully finished
2026-01-08 03:12:15,402 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker rev-parse origin/master) successfully finished
2026-01-08 03:12:15,433 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker describe origin/master --always --tags --long --abbrev=8) successfully finished
2026-01-08 03:12:15,459 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker rev-list HEAD..b3f9566b8b8863ec85a00ce424d77c8e19576c44 --count) successfully finished
2026-01-08 03:12:15,486 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker log 5836eab233bc0b88c9fcf692a1e926939d3f68e3..origin/master --format="sha:%H%x1Dauthor:%an%x1Ddate:%ct%x1Dsubject:%s%x1Dmessage:%b%x1E" --max-count=100) successfully finished
2026-01-08 03:12:15,644 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/moonraker for-each-ref --count=100 --sort='-creatordate' --contains=HEAD --merged=origin/master --format='%(if)%(*objecttype)%(then)%(*objecttype) %(*objectname)%(else)%(objecttype) %(objectname)%(end) %(refname)' 'refs/tags') successfully finished
2026-01-08 03:12:15,646 [git_deploy.py:log_repo_info()] - Git Repo moonraker Detected:
Owner: Arksine
Repository Name: moonraker
Path: /home/luis/moonraker
Remote: origin
Branch: master
Remote URL: https://github.com/Arksine/moonraker.git
Recovery URL: https://github.com/Arksine/moonraker.git
Current Commit SHA: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Upstream Commit SHA: b3f9566b8b8863ec85a00ce424d77c8e19576c44
Current Version: v0.9.3-120-g5836eab2
Upstream Version: v0.9.3-131-gb3f9566b
Rollback Commit: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Rollback Branch: master
Rollback Version: v0.9.3-120-g5836eab2
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 11
Diverged: False
Pinned Commit: None
Repo Warnings:
  Repo has untracked source files: ['moonraker/components/timelapse.py']
2026-01-08 03:12:15,646 [base_deploy.py:log_info()] - Git Repo moonraker: Channel: dev
2026-01-08 03:12:15,646 [base_deploy.py:log_info()] - Git Repo moonraker: Validity check for git repo passed
2026-01-08 03:12:18,732 [authorization.py:_check_trusted_connection()] - Trusted Connection Detected, IP: 10.160.210.133
2026-01-08 03:12:18,740 [application.py:log_request()] - 101 GET /websocket (10.160.210.133) [_TRUSTED_USER_] 12.16ms
2026-01-08 03:12:18,741 [websockets.py:open()] - Websocket Opened: ID: 547766919760, Proxied: True, User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36, Host Name: 10.160.210.74
2026-01-08 03:12:18,754 [websockets.py:_handle_identify()] - Websocket 547766919760 Client Identified - Name: mainsail, Version: 2.16.1, Type: web
2026-01-08 03:12:21,620 [application.py:log_request()] - 404 GET /server/files/config/.theme/default.json?time=1767841939220 (10.160.210.133) [_TRUSTED_USER_] 2279.97ms
2026-01-08 03:12:21,628 [application.py:log_request()] - 404 GET /server/files/config/.theme/maintenance.json?time=1767841939221 (10.160.210.133) [_TRUSTED_USER_] 2283.59ms
2026-01-08 03:12:21,636 [proc_stats.py:_watchdog_callback()] - EVENT LOOP BLOCKED: 4.11 seconds, total blocked count: 1
2026-01-08 03:12:21,645 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:21,837 [proc_stats.py:log_last_stats()] - 
System Time: 1767841935.529433, Usage: 9.88%, Memory: 63936 kB
System Time: 1767841936.529937, Usage: 2.4%, Memory: 63948 kB
System Time: 1767841937.529584, Usage: 0.83%, Memory: 63948 kB
System Time: 1767841938.532895, Usage: 0.77%, Memory: 63948 kB
System Time: 1767841941.660764, Usage: 3.77%, Memory: 64332 kB
2026-01-08 03:12:21,894 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:23,680 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:25,696 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:27,682 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:29,687 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:31,263 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper status --porcelain -b) successfully finished
2026-01-08 03:12:31,289 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper branch --list --no-color) successfully finished
2026-01-08 03:12:31,338 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper remote get-url origin) successfully finished
2026-01-08 03:12:31,680 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:33,715 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:35,678 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:37,660 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:37,696 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper fetch origin --prune --progress) successfully finished
2026-01-08 03:12:37,726 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper merge-base --is-ancestor HEAD origin/master) successfully finished
2026-01-08 03:12:37,751 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper rev-parse HEAD) successfully finished
2026-01-08 03:12:37,956 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper describe --always --tags --long --dirty --abbrev=8) successfully finished
2026-01-08 03:12:37,980 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper rev-parse origin/master) successfully finished
2026-01-08 03:12:38,173 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper describe origin/master --always --tags --long --abbrev=8) successfully finished
2026-01-08 03:12:38,204 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper rev-list HEAD..e605fd18560fbb5a7413ca12b72325ad4e18de16 --count) successfully finished
2026-01-08 03:12:38,238 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper log c803249467a84fe1e37e01bc02f88abb29384bab..origin/master --format="sha:%H%x1Dauthor:%an%x1Ddate:%ct%x1Dsubject:%s%x1Dmessage:%b%x1E" --max-count=100) successfully finished
2026-01-08 03:12:38,458 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/klipper for-each-ref --count=100 --sort='-creatordate' --contains=HEAD --merged=origin/master --format='%(if)%(*objecttype)%(then)%(*objecttype) %(*objectname)%(else)%(objecttype) %(objectname)%(end) %(refname)' 'refs/tags') successfully finished
2026-01-08 03:12:38,459 [git_deploy.py:log_repo_info()] - Git Repo klipper Detected:
Owner: Klipper3d
Repository Name: klipper
Path: /home/luis/klipper
Remote: origin
Branch: master
Remote URL: https://github.com/Klipper3d/klipper.git
Recovery URL: https://github.com/Klipper3d/klipper.git
Current Commit SHA: c803249467a84fe1e37e01bc02f88abb29384bab
Upstream Commit SHA: e605fd18560fbb5a7413ca12b72325ad4e18de16
Current Version: v0.13.0-320-gc8032494
Upstream Version: v0.13.0-457-ge605fd18
Rollback Commit: c803249467a84fe1e37e01bc02f88abb29384bab
Rollback Branch: master
Rollback Version: v0.13.0-320-gc8032494
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 137
Diverged: False
Pinned Commit: None
2026-01-08 03:12:38,459 [base_deploy.py:log_info()] - Git Repo klipper: Channel: dev
2026-01-08 03:12:38,459 [base_deploy.py:log_info()] - Git Repo klipper: Validity check for git repo passed
2026-01-08 03:12:38,961 [base_deploy.py:log_info()] - Web Client mainsail: Detected
Repo: mainsail-crew/mainsail
Channel: stable
Path: /home/luis/mainsail
Local Version: v2.14.0
Remote Version: v2.16.1
Valid: True
Fallback Detected: False
Pre-release: False
Download Url: https://github.com/mainsail-crew/mainsail/releases/download/v2.16.1/mainsail.zip
Download Size: 3000137
Content Type: application/zip
Rollback Version: v2.14.0
Rollback Repo: mainsail-crew/mainsail
2026-01-08 03:12:39,064 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config status --porcelain -b) successfully finished
2026-01-08 03:12:39,090 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config branch --list --no-color) successfully finished
2026-01-08 03:12:39,138 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config remote get-url origin) successfully finished
2026-01-08 03:12:39,658 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:40,038 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config fetch origin --prune --progress) successfully finished
2026-01-08 03:12:40,065 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config merge-base --is-ancestor HEAD origin/master) successfully finished
2026-01-08 03:12:40,090 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config rev-parse HEAD) successfully finished
2026-01-08 03:12:40,120 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config describe --always --tags --long --dirty --abbrev=8) successfully finished
2026-01-08 03:12:40,146 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config rev-parse origin/master) successfully finished
2026-01-08 03:12:40,173 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config describe origin/master --always --tags --long --abbrev=8) successfully finished
2026-01-08 03:12:40,199 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/mainsail-config rev-list HEAD..ff3869a621db17ce3ef660adbbd3fa321995ac42 --count) successfully finished
2026-01-08 03:12:40,200 [git_deploy.py:log_repo_info()] - Git Repo mainsail-config Detected:
Owner: mainsail-crew
Repository Name: mainsail-config
Path: /home/luis/mainsail-config
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/mainsail-config.git
Recovery URL: https://github.com/mainsail-crew/mainsail-config.git
Current Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Upstream Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Current Version: v1.2.1-1-gff3869a6
Upstream Version: v1.2.1-1-gff3869a6
Rollback Commit: ff3869a621db17ce3ef660adbbd3fa321995ac42
Rollback Branch: master
Rollback Version: v1.2.1-1-gff3869a6
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 03:12:40,200 [base_deploy.py:log_info()] - Git Repo mainsail-config: Channel: dev
2026-01-08 03:12:40,200 [base_deploy.py:log_info()] - Git Repo mainsail-config: Validity check for git repo passed
2026-01-08 03:12:40,332 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest status --porcelain -b) successfully finished
2026-01-08 03:12:40,358 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest branch --list --no-color) successfully finished
2026-01-08 03:12:40,406 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest remote get-url origin) successfully finished
2026-01-08 03:12:41,645 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:41,751 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest fetch origin --prune --progress) successfully finished
2026-01-08 03:12:41,775 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest merge-base --is-ancestor HEAD origin/master) successfully finished
2026-01-08 03:12:41,797 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest rev-parse HEAD) successfully finished
2026-01-08 03:12:41,828 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest describe --always --tags --long --dirty --abbrev=8) successfully finished
2026-01-08 03:12:41,853 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest rev-parse origin/master) successfully finished
2026-01-08 03:12:41,883 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest describe origin/master --always --tags --long --abbrev=8) successfully finished
2026-01-08 03:12:41,909 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest rev-list HEAD..9cc3d4af94bcc67741ddf07ac301df5de8ba23a4 --count) successfully finished
2026-01-08 03:12:41,935 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest log 059fa8775f60503f7aca4bb4812795997b35b142..origin/master --format="sha:%H%x1Dauthor:%an%x1Ddate:%ct%x1Dsubject:%s%x1Dmessage:%b%x1E" --max-count=100) successfully finished
2026-01-08 03:12:41,979 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/crowsnest for-each-ref --count=100 --sort='-creatordate' --contains=HEAD --merged=origin/master --format='%(if)%(*objecttype)%(then)%(*objecttype) %(*objectname)%(else)%(objecttype) %(objectname)%(end) %(refname)' 'refs/tags') successfully finished
2026-01-08 03:12:41,980 [git_deploy.py:log_repo_info()] - Git Repo crowsnest Detected:
Owner: mainsail-crew
Repository Name: crowsnest
Path: /home/luis/crowsnest
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/crowsnest.git
Recovery URL: https://github.com/mainsail-crew/crowsnest.git
Current Commit SHA: 059fa8775f60503f7aca4bb4812795997b35b142
Upstream Commit SHA: 9cc3d4af94bcc67741ddf07ac301df5de8ba23a4
Current Version: v4.1.16-1-g059fa877
Upstream Version: v4.1.17-1-g9cc3d4af
Rollback Commit: 059fa8775f60503f7aca4bb4812795997b35b142
Rollback Branch: master
Rollback Version: v4.1.16-1-g059fa877
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 6
Diverged: False
Pinned Commit: None
2026-01-08 03:12:41,980 [base_deploy.py:log_info()] - Git Repo crowsnest: Channel: dev
2026-01-08 03:12:41,981 [base_deploy.py:log_info()] - Git Repo crowsnest: Validity check for git repo passed
2026-01-08 03:12:42,537 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar status --porcelain -b) successfully finished
2026-01-08 03:12:42,561 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar branch --list --no-color) successfully finished
2026-01-08 03:12:42,609 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar remote get-url origin) successfully finished
2026-01-08 03:12:43,532 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar fetch origin --prune --progress) successfully finished
2026-01-08 03:12:43,556 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar merge-base --is-ancestor HEAD origin/main) successfully finished
2026-01-08 03:12:43,580 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar rev-parse HEAD) successfully finished
2026-01-08 03:12:43,608 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar describe --always --tags --long --dirty --abbrev=8) successfully finished
2026-01-08 03:12:43,631 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar rev-parse origin/main) successfully finished
2026-01-08 03:12:43,655 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:43,662 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar describe origin/main --always --tags --long --abbrev=8) successfully finished
2026-01-08 03:12:43,689 [shell_command.py:_check_proc_success()] - Command (git -C /home/luis/sonar rev-list HEAD..3fe23fef07dbc19a9b66bdd111bbd1d574d19955 --count) successfully finished
2026-01-08 03:12:43,690 [git_deploy.py:log_repo_info()] - Git Repo sonar Detected:
Owner: mainsail-crew
Repository Name: sonar
Path: /home/luis/sonar
Remote: origin
Branch: main
Remote URL: https://github.com/mainsail-crew/sonar.git
Recovery URL: https://github.com/mainsail-crew/sonar.git
Current Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Upstream Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Current Version: v0.2.0-0-g3fe23fef
Upstream Version: v0.2.0-0-g3fe23fef
Rollback Commit: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Rollback Branch: main
Rollback Version: v0.2.0-0-g3fe23fef
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 03:12:43,690 [base_deploy.py:log_info()] - Git Repo sonar: Channel: dev
2026-01-08 03:12:43,690 [base_deploy.py:log_info()] - Git Repo sonar: Validity check for git repo passed
2026-01-08 03:12:45,629 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:47,628 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:49,623 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:51,527 [klippy_connection.py:_do_connect()] - Klippy Connection Established
2026-01-08 03:12:51,612 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['system.slice', 'sysinit.target', '-.mount']
**After=['systemd-journald.socket', 'system.slice', 'sysinit.target', 'basic.target', 'network-online.target', '-.mount']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 03:12:51,628 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: -32601, Message: Method not found
2026-01-08 03:12:51,637 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.objects.query, Code: -32601, Message: Method not found
2026-01-08 03:12:51,866 [server.py:add_log_rollover_item()] - Klipper Version: v0.13.0-320-gc80324946
2026-01-08 03:12:51,882 [klippy_connection.py:_request_initial_subscriptions()] - Webhooks Subscribed
2026-01-08 03:12:51,884 [klippy_connection.py:_request_initial_subscriptions()] - GCode Output Subscribed
2026-01-08 03:12:51,886 [klippy_connection.py:_check_ready()] - 
Unable to open config file /home/luis/printer_data/config/printer.cfg

Once the underlying issue is corrected, use the "RESTART"
command to reload the config and restart the host software.
Printer is halted

2026-01-08 03:17:48,799 [websockets.py:on_close()] - Websocket Closed: ID: 547766919760 Close Code: 1001, Close Reason: None, Pong Time Elapsed: 20.00
2026-01-08 03:17:49,845 [application.py:log_request()] - 101 GET /websocket (10.160.210.133) [_TRUSTED_USER_] 3.50ms
2026-01-08 03:17:49,845 [websockets.py:open()] - Websocket Opened: ID: 547745902032, Proxied: True, User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36, Host Name: 10.160.210.74
2026-01-08 03:17:49,945 [websockets.py:_handle_identify()] - Websocket 547745902032 Client Identified - Name: mainsail, Version: 2.14.0, Type: web
2026-01-08 03:18:01,121 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: server.files.delete_file, Code: 403, Message: Access to file client.cfg forbidden by reserved path 'update_manager mainsail-config'
2026-01-08 03:18:06,090 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: server.files.delete_file, Code: 403, Message: Access to file client.cfg forbidden by reserved path 'update_manager mainsail-config'
2026-01-08 03:18:25,147 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryjxxmulvGI1f76uoi
2026-01-08 03:18:25,173 [application.py:post()] - Processing Uploaded File: crowsnest.conf
2026-01-08 03:18:25,187 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 43.55ms
2026-01-08 03:18:25,260 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryV86ImvcRKo9dTA10
2026-01-08 03:18:25,279 [application.py:post()] - Processing Uploaded File: eddy.cfg
2026-01-08 03:18:25,290 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 31.40ms
2026-01-08 03:18:25,341 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryLfkxK1KGL0QW56Na
2026-01-08 03:18:25,358 [application.py:post()] - Processing Uploaded File: macros.cfg
2026-01-08 03:18:25,370 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 29.97ms
2026-01-08 03:18:25,452 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryiB4OwS9vNImVizqq
2026-01-08 03:18:25,472 [application.py:post()] - Processing Uploaded File: mainsail.cfg
2026-01-08 03:18:25,475 [web.py:log_exception()] - 403 POST /server/files/upload (10.160.210.133): Access to file client.cfg forbidden by reserved path 'update_manager mainsail-config'
2026-01-08 03:18:25,499 [application.py:log_request()] - 403 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 47.67ms
2026-01-08 03:18:25,559 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryK7egWOI9u73yHDCp
2026-01-08 03:18:25,575 [application.py:post()] - Processing Uploaded File: moonraker.conf
2026-01-08 03:18:25,586 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 29.07ms
2026-01-08 03:18:25,635 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary1BmnqkROSnfYhGCo
2026-01-08 03:18:25,654 [application.py:post()] - Processing Uploaded File: printer.cfg
2026-01-08 03:18:25,665 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 31.24ms
2026-01-08 03:18:25,697 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundarymMp5IK9X8SzDLX2v
2026-01-08 03:18:25,715 [application.py:post()] - Processing Uploaded File: printer-20251229_194021.cfg
2026-01-08 03:18:25,725 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 29.84ms
2026-01-08 03:18:25,767 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundarynHg49qPC4jBUjpVA
2026-01-08 03:18:25,783 [application.py:post()] - Processing Uploaded File: printer-20251229_194319.cfg
2026-01-08 03:18:25,793 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 27.43ms
2026-01-08 03:18:25,851 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryxMZVpJv7MdqhALDr
2026-01-08 03:18:25,867 [application.py:post()] - Processing Uploaded File: printer-20251230_160224.cfg
2026-01-08 03:18:25,878 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 28.63ms
2026-01-08 03:18:25,938 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryysAhVX6nA2TPKoTo
2026-01-08 03:18:25,959 [application.py:post()] - Processing Uploaded File: printer-20251230_163706.cfg
2026-01-08 03:18:25,970 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 35.09ms
2026-01-08 03:18:26,050 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundarybOSpWBoloAAlLenW
2026-01-08 03:18:26,061 [application.py:post()] - Processing Uploaded File: printer-20251230_165454.cfg
2026-01-08 03:18:26,068 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 19.23ms
2026-01-08 03:18:26,152 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7pgZvRwBpc8Qwq3s
2026-01-08 03:18:26,164 [application.py:post()] - Processing Uploaded File: printer-20251230_165753.cfg
2026-01-08 03:18:26,171 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 19.52ms
2026-01-08 03:18:26,224 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundarymVjmyicF8jg8sTAa
2026-01-08 03:18:26,234 [application.py:post()] - Processing Uploaded File: sonar.conf
2026-01-08 03:18:26,241 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 17.95ms
2026-01-08 03:18:26,322 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryirVlXHORAl8u4GDU
2026-01-08 03:18:26,334 [application.py:post()] - Processing Uploaded File: timelapse.cfg
2026-01-08 03:18:26,341 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 20.42ms
2026-01-08 03:18:26,374 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary9Jt9BPw5dA1mE93v
2026-01-08 03:18:26,384 [application.py:post()] - Processing Uploaded File: tmc.cfg
2026-01-08 03:18:26,391 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 18.04ms
2026-01-08 03:18:26,433 [application.py:prepare()] - Upload Request Received from 10.160.210.133
Content-Type: multipart/form-data; boundary=----WebKitFormBoundarya7qVCB4Czg1kUcFn
2026-01-08 03:18:26,443 [application.py:post()] - Processing Uploaded File: variables.cfg
2026-01-08 03:18:26,450 [application.py:log_request()] - 201 POST /server/files/upload (10.160.210.133) [_TRUSTED_USER_] 18.30ms
2026-01-08 03:18:31,334 [klippy_connection.py:_on_connection_closed()] - Klippy Connection Removed
2026-01-08 03:18:32,594 [klippy_connection.py:_do_connect()] - Klippy Connection Established
2026-01-08 03:20:05,693 [klippy_connection.py:_request_initial_subscriptions()] - Webhooks Subscribed
2026-01-08 03:20:05,695 [klippy_connection.py:_request_initial_subscriptions()] - GCode Output Subscribed
2026-01-08 03:20:05,699 [klippy_connection.py:_check_ready()] - 
mcu 'mcu': Unable to connect
Once the underlying issue is corrected, use the
"FIRMWARE_RESTART" command to reset the firmware, reload the
config, and restart the host software.
Error configuring printer

2026-01-08 03:29:50,228 [klippy_connection.py:close()] - Error closing Klippy Unix Socket
Traceback (most recent call last):
  File "/home/luis/moonraker/moonraker/components/klippy_connection.py", line 805, in close
    await self.writer.wait_closed()
  File "/usr/lib/python3.11/asyncio/streams.py", line 350, in wait_closed
    await self._protocol._get_close_waiter(self)
ConnectionResetError: [Errno 104] Connection reset by peer
2026-01-08 03:29:50,228 [klippy_connection.py:_on_connection_closed()] - Klippy Connection Removed
2026-01-08 03:29:50,230 [common.py:build_error()] - JSON-RPC Request Error - Requested Method: printer.info, Code: 503, Message: Klippy Disconnected
2026-01-08 03:29:50,483 [klippy_connection.py:_do_connect()] - Klippy Connection Established
-------------------- Log Start | Thu Jan  8 15:49:17 2026 --------------------
platform: Linux-6.12.47+rpt-rpi-v8-aarch64-with-glibc2.36
data_path: /home/luis/printer_data
is_default_data_path: False
config_file: /home/luis/printer_data/config/moonraker.conf
backup_config: /home/luis/printer_data/config/.moonraker.conf.bkp
startup_warnings: []
verbose: False
debug: False
asyncio_debug: False
is_backup_config: False
is_python_package: True
instance_uuid: 3f5c60401f1a4b94a107f77b27ae0653
unix_socket_path: /home/luis/printer_data/comms/moonraker.sock
structured_logging: False
software_version: v0.9.3-120-g5836eab
git_branch: master
git_remote: origin
git_repo_url: https://github.com/Arksine/moonraker.git
modified_files: []
unofficial_components: []
log_file: /home/luis/printer_data/logs/moonraker.log
python_version: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]
launch_args: /home/luis/moonraker-env/bin/python /home/luis/moonraker/moonraker/__main__.py
msgspec_enabled: True
uvloop_enabled: True
2026-01-08 15:49:17,882 [confighelper.py:read_file()] - Configuration File '/home/luis/printer_data/config/moonraker.conf' parsed, total size: 2192 B
2026-01-08 15:49:17,882 [server.py:add_log_rollover_item()] - 
#################### Moonraker Configuration ####################

[server]
host = 0.0.0.0
port = 7125
max_upload_size = 1024
klippy_uds_address = ~/printer_data/comms/klippy.sock

[file_manager]
enable_object_processing = False

[authorization]
cors_domains = 
	https://my.mainsail.xyz
	http://my.mainsail.xyz
	http://*.local
	http://*.lan
trusted_clients = 
	10.0.0.0/8
	127.0.0.0/8
	169.254.0.0/16
	172.16.0.0/12
	192.168.0.0/16
	FE80::/10
	::1/128

[octoprint_compat]

[history]

[announcements]
subscriptions = 
	mainsail

[update_manager]
refresh_interval = 168
enable_auto_refresh = True

[update_manager mainsail]
type = web
channel = stable
repo = mainsail-crew/mainsail
path = ~/mainsail

[update_manager mainsail-config]
type = git_repo
primary_branch = master
path = ~/mainsail-config
origin = https://github.com/mainsail-crew/mainsail-config.git
managed_services = klipper

[update_manager crowsnest]
type = git_repo
path = ~/crowsnest
origin = https://github.com/mainsail-crew/crowsnest.git
managed_services = crowsnest
install_script = tools/pkglist.sh

[update_manager sonar]
type = git_repo
path = ~/sonar
origin = https://github.com/mainsail-crew/sonar.git
primary_branch = main
managed_services = sonar
system_dependencies = resources/system-dependencies.json

#################################################################
All Configuration Files:
/home/luis/printer_data/config/moonraker.conf
#################################################################
2026-01-08 15:49:18,384 [server.py:load_component()] - Component (secrets) loaded
2026-01-08 15:49:18,405 [server.py:load_component()] - Component (template) loaded
2026-01-08 15:49:18,416 [server.py:load_component()] - Component (klippy_connection) loaded
2026-01-08 15:49:22,091 [application.py:__init__()] - Detected Tornado Version 6.5.1
2026-01-08 15:49:22,095 [server.py:load_component()] - Component (application) loaded
2026-01-08 15:49:22,177 [server.py:load_component()] - Component (websockets) loaded
2026-01-08 15:49:22,508 [server.py:add_log_rollover_item()] - Loading Sqlite database provider. Sqlite Version: 3.40.1
2026-01-08 15:49:22,560 [server.py:add_log_rollover_item()] - Unsafe Shutdown Count: 1
2026-01-08 15:49:22,564 [server.py:load_component()] - Component (database) loaded
2026-01-08 15:49:23,412 [server.py:load_component()] - Component (dbus_manager) loaded
2026-01-08 15:49:23,523 [file_manager.py:__init__()] - Using File System Observer: inotify
2026-01-08 15:49:23,687 [server.py:load_component()] - Component (file_manager) loaded
2026-01-08 15:49:23,798 [database.py:register_table()] - Found registered table authorized_users
2026-01-08 15:49:23,801 [authorization.py:__init__()] - Authorization Configuration Loaded
Trusted Clients:
10.0.0.0/8
127.0.0.0/8
169.254.0.0/16
172.16.0.0/12
192.168.0.0/16
fe80::/10
::1/128
CORS Domains:
https://my\\.mainsail\\.xyz
http://my\\.mainsail\\.xyz
http://.*\\.local
http://.*\\.lan
2026-01-08 15:49:23,805 [server.py:load_component()] - Component (authorization) loaded
2026-01-08 15:49:23,818 [server.py:load_component()] - Component (klippy_apis) loaded
2026-01-08 15:49:24,361 [server.py:add_log_rollover_item()] - 
System Info:

***python***
  version: (3, 11, 2, 'final', 0)
  version_string: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]

***cpu_info***
  cpu_count: 4
  bits: 64bit
  processor: aarch64
  cpu_desc: 
  serial_number: 272b6098
  hardware_desc: 
  model: Raspberry Pi 3 Model B Plus Rev 1.3
  total_memory: 876816
  memory_units: kB

***sd_info***
  manufacturer_id: 00
  manufacturer: Unknown
  oem_id: 0000
  product_name: USD  
  product_revision: 2.0
  serial_number: 000002f8
  manufacturer_date: 5/2023
  capacity: 59.5 GiB
  total_bytes: 63908610048

***distribution***
  name: Debian GNU/Linux 12 (bookworm)
  id: debian
  version: 12
  version_parts: {'major': '12', 'minor': '', 'build_number': ''}
  like: 
  codename: bookworm
  release_info: {'name': 'MainsailOS', 'version_id': '2.2.2', 'codename': 'bookworm', 'id': 'mainsailos'}
  kernel_version: 6.12.47+rpt-rpi-v8

***virtualization***
  virt_type: none
  virt_identifier: none

***network***

***canbus***

***Allowed Services***
  klipper_mcu
  webcamd
  MoonCord
  KlipperScreen
  moonraker-telegram-bot
  moonraker-obico
  sonar
  crowsnest
  octoeverywhere
  ratos-configurator
2026-01-08 15:49:24,370 [server.py:load_component()] - Component (shell_command) loaded
2026-01-08 15:49:24,371 [machine.py:__init__()] - Using System Provider: systemd_dbus
2026-01-08 15:49:24,593 [server.py:add_log_rollover_item()] - Found libcamera Python module, version: v0.5.2+99-bfd68f78
2026-01-08 15:49:24,594 [server.py:load_component()] - Component (machine) loaded
2026-01-08 15:49:24,600 [server.py:load_component()] - Component (data_store) loaded
2026-01-08 15:49:24,605 [proc_stats.py:__init__()] - Detected 'vcgencmd', throttle checking enabled
2026-01-08 15:49:24,607 [proc_stats.py:_get_cpu_thermal_file()] - Monitoring temperature for Raspberry Pi CPU
2026-01-08 15:49:24,608 [server.py:load_component()] - Component (proc_stats) loaded
2026-01-08 15:49:24,612 [server.py:load_component()] - Component (job_state) loaded
2026-01-08 15:49:24,620 [server.py:load_component()] - Component (job_queue) loaded
2026-01-08 15:49:24,627 [database.py:register_table()] - Found registered table job_history
2026-01-08 15:49:24,627 [database.py:register_table()] - Found registered table job_totals
2026-01-08 15:49:24,630 [server.py:load_component()] - Component (history) loaded
2026-01-08 15:49:24,648 [server.py:load_component()] - Component (http_client) loaded
2026-01-08 15:49:24,658 [server.py:load_component()] - Component (announcements) loaded
2026-01-08 15:49:24,666 [server.py:load_component()] - Component (webcam) loaded
2026-01-08 15:49:24,672 [server.py:load_component()] - Component (extensions) loaded
2026-01-08 15:49:24,809 [base_deploy.py:log_info()] - Git Repo moonraker: Detected virtualenv: /home/luis/moonraker-env
2026-01-08 15:49:24,814 [base_deploy.py:log_info()] - Git Repo klipper: Detected virtualenv: /home/luis/klippy-env
2026-01-08 15:49:24,835 [server.py:load_component()] - Component (update_manager) loaded
2026-01-08 15:49:24,845 [server.py:load_component()] - Component (octoprint_compat) loaded
2026-01-08 15:49:24,846 [server.py:_initialize_component()] - Performing Component Post Init: [database]
2026-01-08 15:49:24,875 [server.py:_initialize_component()] - Performing Component Post Init: [dbus_manager]
2026-01-08 15:49:24,889 [server.py:_initialize_component()] - Performing Component Post Init: [authorization]
2026-01-08 15:49:24,892 [server.py:_initialize_component()] - Performing Component Post Init: [machine]
2026-01-08 15:49:24,894 [machine.py:validation_init()] - Installation version in database up to date
2026-01-08 15:49:25,524 [machine.py:check_virt_status()] - No Virtualization Detected
2026-01-08 15:49:25,647 [machine.py:_find_public_ip()] - Detected Local IP: 10.160.210.74
2026-01-08 15:49:25,650 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 15:49:25,726 [server.py:add_log_rollover_item()] - 
Systemd unit moonraker.service:
unit_name: moonraker.service
is_default: True
manager: systemd
Properties:
**Requires=['network-online.target', 'system.slice', 'sysinit.target']
**After=['systemd-journald.socket', 'sysinit.target', 'klipper.service', 'network-online.target', 'basic.target', 'system.slice']
**SupplementaryGroups=['moonraker-admin']
**EnvironmentFiles=/home/luis/printer_data/systemd/moonraker.env
**ExecStart=/home/luis/moonraker-env/bin/python $MOONRAKER_ARGS
**WorkingDirectory=
**FragmentPath=/etc/systemd/system/moonraker.service
**Description=API Server for Klipper SV1
**User=luis
2026-01-08 15:49:25,726 [server.py:_initialize_component()] - Performing Component Post Init: [proc_stats]
2026-01-08 15:49:25,727 [server.py:_initialize_component()] - Performing Component Post Init: [history]
2026-01-08 15:49:25,738 [server.py:_initialize_component()] - Performing Component Post Init: [announcements]
2026-01-08 15:49:25,765 [server.py:_initialize_component()] - Performing Component Post Init: [webcam]
2026-01-08 15:49:25,765 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 15:49:25,772 [server.py:_initialize_component()] - Performing Component Post Init: [klippy_connection]
2026-01-08 15:49:25,772 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['system.slice', 'sysinit.target', '-.mount']
**After=['systemd-journald.socket', 'system.slice', 'sysinit.target', 'basic.target', 'network-online.target', '-.mount']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 15:49:25,772 [server.py:_initialize_component()] - Performing Component Post Init: [update_manager]
2026-01-08 15:49:26,520 [base_deploy.py:log_info()] - PackageDeploy: PackageKit Provider Configured
2026-01-08 15:49:26,523 [git_deploy.py:log_repo_info()] - Git Repo moonraker Detected:
Owner: Arksine
Repository Name: moonraker
Path: /home/luis/moonraker
Remote: origin
Branch: master
Remote URL: https://github.com/Arksine/moonraker.git
Recovery URL: https://github.com/Arksine/moonraker.git
Current Commit SHA: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Upstream Commit SHA: b3f9566b8b8863ec85a00ce424d77c8e19576c44
Current Version: v0.9.3-120-g5836eab2
Upstream Version: v0.9.3-131-gb3f9566b
Rollback Commit: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Rollback Branch: master
Rollback Version: v0.9.3-120-g5836eab2
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 11
Diverged: False
Pinned Commit: None
Repo Warnings:
  Repo has untracked source files: ['moonraker/components/timelapse.py']
2026-01-08 15:49:26,527 [git_deploy.py:log_repo_info()] - Git Repo klipper Detected:
Owner: Klipper3d
Repository Name: klipper
Path: /home/luis/klipper
Remote: origin
Branch: master
Remote URL: https://github.com/Klipper3d/klipper.git
Recovery URL: https://github.com/Klipper3d/klipper.git
Current Commit SHA: c803249467a84fe1e37e01bc02f88abb29384bab
Upstream Commit SHA: e605fd18560fbb5a7413ca12b72325ad4e18de16
Current Version: v0.13.0-320-gc8032494
Upstream Version: v0.13.0-457-ge605fd18
Rollback Commit: c803249467a84fe1e37e01bc02f88abb29384bab
Rollback Branch: master
Rollback Version: v0.13.0-320-gc8032494
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 137
Diverged: False
Pinned Commit: None
2026-01-08 15:49:26,535 [base_deploy.py:log_info()] - Web Client mainsail: Detected
Repo: mainsail-crew/mainsail
Channel: stable
Path: /home/luis/mainsail
Local Version: v2.14.0
Remote Version: v2.16.1
Valid: True
Fallback Detected: False
Pre-release: False
Download Url: https://github.com/mainsail-crew/mainsail/releases/download/v2.16.1/mainsail.zip
Download Size: 3000137
Content Type: application/zip
Rollback Version: v2.14.0
Rollback Repo: mainsail-crew/mainsail
2026-01-08 15:49:26,538 [git_deploy.py:log_repo_info()] - Git Repo mainsail-config Detected:
Owner: mainsail-crew
Repository Name: mainsail-config
Path: /home/luis/mainsail-config
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/mainsail-config.git
Recovery URL: https://github.com/mainsail-crew/mainsail-config.git
Current Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Upstream Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Current Version: v1.2.1-1-gff3869a6
Upstream Version: v1.2.1-1-gff3869a6
Rollback Commit: ff3869a621db17ce3ef660adbbd3fa321995ac42
Rollback Branch: master
Rollback Version: v1.2.1-1-gff3869a6
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 15:49:26,541 [git_deploy.py:log_repo_info()] - Git Repo crowsnest Detected:
Owner: mainsail-crew
Repository Name: crowsnest
Path: /home/luis/crowsnest
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/crowsnest.git
Recovery URL: https://github.com/mainsail-crew/crowsnest.git
Current Commit SHA: 059fa8775f60503f7aca4bb4812795997b35b142
Upstream Commit SHA: 9cc3d4af94bcc67741ddf07ac301df5de8ba23a4
Current Version: v4.1.16-1-g059fa877
Upstream Version: v4.1.17-1-g9cc3d4af
Rollback Commit: 059fa8775f60503f7aca4bb4812795997b35b142
Rollback Branch: master
Rollback Version: v4.1.16-1-g059fa877
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 6
Diverged: False
Pinned Commit: None
2026-01-08 15:49:26,544 [git_deploy.py:log_repo_info()] - Git Repo sonar Detected:
Owner: mainsail-crew
Repository Name: sonar
Path: /home/luis/sonar
Remote: origin
Branch: main
Remote URL: https://github.com/mainsail-crew/sonar.git
Recovery URL: https://github.com/mainsail-crew/sonar.git
Current Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Upstream Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Current Version: v0.2.0-0-g3fe23fef
Upstream Version: v0.2.0-0-g3fe23fef
Rollback Commit: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Rollback Branch: main
Rollback Version: v0.2.0-0-g3fe23fef
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 15:49:26,545 [base_deploy.py:log_info()] - PackageKit: Next refresh in: 6 Days, 11 Hours, 22 Minutes, 25 Seconds
2026-01-08 15:49:26,545 [base_deploy.py:log_info()] - Git Repo moonraker: Next refresh in: 6 Days, 11 Hours, 22 Minutes, 49 Seconds
2026-01-08 15:49:26,545 [base_deploy.py:log_info()] - Git Repo klipper: Next refresh in: 6 Days, 11 Hours, 23 Minutes, 12 Seconds
2026-01-08 15:49:26,545 [base_deploy.py:log_info()] - Web Client mainsail: Next refresh in: 6 Days, 11 Hours, 23 Minutes, 12 Seconds
2026-01-08 15:49:26,545 [base_deploy.py:log_info()] - Git Repo mainsail-config: Next refresh in: 6 Days, 11 Hours, 23 Minutes, 14 Seconds
2026-01-08 15:49:26,545 [base_deploy.py:log_info()] - Git Repo crowsnest: Next refresh in: 6 Days, 11 Hours, 23 Minutes, 15 Seconds
2026-01-08 15:49:26,545 [base_deploy.py:log_info()] - Git Repo sonar: Next refresh in: 6 Days, 11 Hours, 23 Minutes, 17 Seconds
2026-01-08 15:49:26,550 [confighelper.py:create_backup()] - Backing up last working configuration to '/home/luis/printer_data/config/.moonraker.conf.bkp'
2026-01-08 15:49:26,555 [extensions.py:start_unix_server()] - Creating Unix Domain Socket at '/home/luis/printer_data/comms/moonraker.sock'
2026-01-08 15:49:26,557 [server.py:start_server()] - Starting Moonraker on (0.0.0.0, 7125), Hostname: mainsailos
2026-01-08 15:49:26,558 [application.py:listen()] - SSL Certificate/Key not configured, aborting HTTPS Server startup
2026-01-08 15:49:26,810 [klippy_connection.py:_do_connect()] - Klippy Connection Established
2026-01-08 15:49:26,881 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['-.mount', 'system.slice', 'sysinit.target']
**After=['systemd-journald.socket', 'system.slice', 'sysinit.target', '-.mount', 'basic.target', 'network-online.target']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 15:49:27,134 [server.py:add_log_rollover_item()] - Klipper Version: v0.13.0-320-gc80324946
2026-01-08 15:50:51,810 [klippy_connection.py:_request_initial_subscriptions()] - Webhooks Subscribed
2026-01-08 15:50:51,812 [klippy_connection.py:_request_initial_subscriptions()] - GCode Output Subscribed
2026-01-08 15:50:51,815 [klippy_connection.py:_check_ready()] - 
mcu 'mcu': Unable to connect
Once the underlying issue is corrected, use the
"FIRMWARE_RESTART" command to reset the firmware, reload the
config, and restart the host software.
Error configuring printer

2026-01-08 15:54:10,137 [authorization.py:_check_trusted_connection()] - Trusted Connection Detected, IP: 10.160.210.62
2026-01-08 15:54:10,146 [application.py:log_request()] - 101 GET /websocket (10.160.210.62) [_TRUSTED_USER_] 12.30ms
2026-01-08 15:54:10,147 [websockets.py:open()] - Websocket Opened: ID: 547559608208, Proxied: True, User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36, Host Name: 10.160.210.74
2026-01-08 15:54:10,155 [websockets.py:_handle_identify()] - Websocket 547559608208 Client Identified - Name: mainsail, Version: 2.16.1, Type: web
2026-01-08 15:54:25,930 [server.py:add_log_rollover_item()] - CPU Throttled Flags: ['Under-Voltage Detected', 'Currently Throttled', 'Previously Under-Volted', 'Previously Throttled']
                                                                                                                                                                                                                                                                               -------------------- Log Start | Thu Jan  8 15:57:33 2026 --------------------
platform: Linux-6.12.47+rpt-rpi-v8-aarch64-with-glibc2.36
data_path: /home/luis/printer_data
is_default_data_path: False
config_file: /home/luis/printer_data/config/moonraker.conf
backup_config: /home/luis/printer_data/config/.moonraker.conf.bkp
startup_warnings: []
verbose: False
debug: False
asyncio_debug: False
is_backup_config: False
is_python_package: True
instance_uuid: 3f5c60401f1a4b94a107f77b27ae0653
unix_socket_path: /home/luis/printer_data/comms/moonraker.sock
structured_logging: False
software_version: v0.9.3-120-g5836eab
git_branch: master
git_remote: origin
git_repo_url: https://github.com/Arksine/moonraker.git
modified_files: []
unofficial_components: []
log_file: /home/luis/printer_data/logs/moonraker.log
python_version: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]
launch_args: /home/luis/moonraker-env/bin/python /home/luis/moonraker/moonraker/__main__.py
msgspec_enabled: True
uvloop_enabled: True
2026-01-08 15:57:33,112 [confighelper.py:read_file()] - Configuration File '/home/luis/printer_data/config/moonraker.conf' parsed, total size: 2192 B
2026-01-08 15:57:33,113 [server.py:add_log_rollover_item()] - 
#################### Moonraker Configuration ####################

[server]
host = 0.0.0.0
port = 7125
max_upload_size = 1024
klippy_uds_address = ~/printer_data/comms/klippy.sock

[file_manager]
enable_object_processing = False

[authorization]
cors_domains = 
	https://my.mainsail.xyz
	http://my.mainsail.xyz
	http://*.local
	http://*.lan
trusted_clients = 
	10.0.0.0/8
	127.0.0.0/8
	169.254.0.0/16
	172.16.0.0/12
	192.168.0.0/16
	FE80::/10
	::1/128

[octoprint_compat]

[history]

[announcements]
subscriptions = 
	mainsail

[update_manager]
refresh_interval = 168
enable_auto_refresh = True

[update_manager mainsail]
type = web
channel = stable
repo = mainsail-crew/mainsail
path = ~/mainsail

[update_manager mainsail-config]
type = git_repo
primary_branch = master
path = ~/mainsail-config
origin = https://github.com/mainsail-crew/mainsail-config.git
managed_services = klipper

[update_manager crowsnest]
type = git_repo
path = ~/crowsnest
origin = https://github.com/mainsail-crew/crowsnest.git
managed_services = crowsnest
install_script = tools/pkglist.sh

[update_manager sonar]
type = git_repo
path = ~/sonar
origin = https://github.com/mainsail-crew/sonar.git
primary_branch = main
managed_services = sonar
system_dependencies = resources/system-dependencies.json

#################################################################
All Configuration Files:
/home/luis/printer_data/config/moonraker.conf
#################################################################
2026-01-08 15:57:33,594 [server.py:load_component()] - Component (secrets) loaded
2026-01-08 15:57:33,618 [server.py:load_component()] - Component (template) loaded
2026-01-08 15:57:33,628 [server.py:load_component()] - Component (klippy_connection) loaded
2026-01-08 15:57:37,224 [application.py:__init__()] - Detected Tornado Version 6.5.1
2026-01-08 15:57:37,228 [server.py:load_component()] - Component (application) loaded
2026-01-08 15:57:37,314 [server.py:load_component()] - Component (websockets) loaded
2026-01-08 15:57:37,647 [server.py:add_log_rollover_item()] - Loading Sqlite database provider. Sqlite Version: 3.40.1
2026-01-08 15:57:37,707 [server.py:add_log_rollover_item()] - Unsafe Shutdown Count: 2
2026-01-08 15:57:37,712 [server.py:load_component()] - Component (database) loaded
2026-01-08 15:57:38,522 [server.py:load_component()] - Component (dbus_manager) loaded
2026-01-08 15:57:38,632 [file_manager.py:__init__()] - Using File System Observer: inotify
2026-01-08 15:57:38,782 [server.py:load_component()] - Component (file_manager) loaded
2026-01-08 15:57:38,892 [database.py:register_table()] - Found registered table authorized_users
2026-01-08 15:57:38,895 [authorization.py:__init__()] - Authorization Configuration Loaded
Trusted Clients:
10.0.0.0/8
127.0.0.0/8
169.254.0.0/16
172.16.0.0/12
192.168.0.0/16
fe80::/10
::1/128
CORS Domains:
https://my\\.mainsail\\.xyz
http://my\\.mainsail\\.xyz
http://.*\\.local
http://.*\\.lan
2026-01-08 15:57:38,899 [server.py:load_component()] - Component (authorization) loaded
2026-01-08 15:57:38,914 [server.py:load_component()] - Component (klippy_apis) loaded
2026-01-08 15:57:39,451 [server.py:add_log_rollover_item()] - 
System Info:

***python***
  version: (3, 11, 2, 'final', 0)
  version_string: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]

***cpu_info***
  cpu_count: 4
  bits: 64bit
  processor: aarch64
  cpu_desc: 
  serial_number: 272b6098
  hardware_desc: 
  model: Raspberry Pi 3 Model B Plus Rev 1.3
  total_memory: 876816
  memory_units: kB

***sd_info***
  manufacturer_id: 00
  manufacturer: Unknown
  oem_id: 0000
  product_name: USD  
  product_revision: 2.0
  serial_number: 000002f8
  manufacturer_date: 5/2023
  capacity: 59.5 GiB
  total_bytes: 63908610048

***distribution***
  name: Debian GNU/Linux 12 (bookworm)
  id: debian
  version: 12
  version_parts: {'major': '12', 'minor': '', 'build_number': ''}
  like: 
  codename: bookworm
  release_info: {'name': 'MainsailOS', 'version_id': '2.2.2', 'codename': 'bookworm', 'id': 'mainsailos'}
  kernel_version: 6.12.47+rpt-rpi-v8

***virtualization***
  virt_type: none
  virt_identifier: none

***network***

***canbus***

***Allowed Services***
  klipper_mcu
  webcamd
  MoonCord
  KlipperScreen
  moonraker-telegram-bot
  moonraker-obico
  sonar
  crowsnest
  octoeverywhere
  ratos-configurator
2026-01-08 15:57:39,460 [server.py:load_component()] - Component (shell_command) loaded
2026-01-08 15:57:39,460 [machine.py:__init__()] - Using System Provider: systemd_dbus
2026-01-08 15:57:39,684 [server.py:add_log_rollover_item()] - Found libcamera Python module, version: v0.5.2+99-bfd68f78
2026-01-08 15:57:39,685 [server.py:load_component()] - Component (machine) loaded
2026-01-08 15:57:39,691 [server.py:load_component()] - Component (data_store) loaded
2026-01-08 15:57:39,697 [proc_stats.py:__init__()] - Detected 'vcgencmd', throttle checking enabled
2026-01-08 15:57:39,698 [proc_stats.py:_get_cpu_thermal_file()] - Monitoring temperature for Raspberry Pi CPU
2026-01-08 15:57:39,699 [server.py:load_component()] - Component (proc_stats) loaded
2026-01-08 15:57:39,703 [server.py:load_component()] - Component (job_state) loaded
2026-01-08 15:57:39,711 [server.py:load_component()] - Component (job_queue) loaded
2026-01-08 15:57:39,718 [database.py:register_table()] - Found registered table job_history
2026-01-08 15:57:39,719 [database.py:register_table()] - Found registered table job_totals
2026-01-08 15:57:39,722 [server.py:load_component()] - Component (history) loaded
2026-01-08 15:57:39,741 [server.py:load_component()] - Component (http_client) loaded
2026-01-08 15:57:39,750 [server.py:load_component()] - Component (announcements) loaded
2026-01-08 15:57:39,759 [server.py:load_component()] - Component (webcam) loaded
2026-01-08 15:57:39,764 [server.py:load_component()] - Component (extensions) loaded
2026-01-08 15:57:39,774 [server.py:load_component()] - Component (octoprint_compat) loaded
2026-01-08 15:57:39,913 [base_deploy.py:log_info()] - Git Repo moonraker: Detected virtualenv: /home/luis/moonraker-env
2026-01-08 15:57:39,918 [base_deploy.py:log_info()] - Git Repo klipper: Detected virtualenv: /home/luis/klippy-env
2026-01-08 15:57:39,938 [server.py:load_component()] - Component (update_manager) loaded
2026-01-08 15:57:39,939 [server.py:_initialize_component()] - Performing Component Post Init: [database]
2026-01-08 15:57:39,980 [server.py:_initialize_component()] - Performing Component Post Init: [dbus_manager]
2026-01-08 15:57:39,994 [server.py:_initialize_component()] - Performing Component Post Init: [authorization]
2026-01-08 15:57:39,996 [server.py:_initialize_component()] - Performing Component Post Init: [machine]
2026-01-08 15:57:39,999 [machine.py:validation_init()] - Installation version in database up to date
2026-01-08 15:57:40,662 [machine.py:check_virt_status()] - No Virtualization Detected
2026-01-08 15:57:40,786 [machine.py:_find_public_ip()] - Detected Local IP: 10.160.210.74
2026-01-08 15:57:40,788 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 15:57:40,860 [server.py:add_log_rollover_item()] - 
Systemd unit moonraker.service:
unit_name: moonraker.service
is_default: True
manager: systemd
Properties:
**Requires=['system.slice', 'network-online.target', 'sysinit.target']
**After=['basic.target', 'klipper.service', 'system.slice', 'systemd-journald.socket', 'network-online.target', 'sysinit.target']
**SupplementaryGroups=['moonraker-admin']
**EnvironmentFiles=/home/luis/printer_data/systemd/moonraker.env
**ExecStart=/home/luis/moonraker-env/bin/python $MOONRAKER_ARGS
**WorkingDirectory=
**FragmentPath=/etc/systemd/system/moonraker.service
**Description=API Server for Klipper SV1
**User=luis
2026-01-08 15:57:40,861 [server.py:_initialize_component()] - Performing Component Post Init: [proc_stats]
2026-01-08 15:57:40,861 [server.py:_initialize_component()] - Performing Component Post Init: [history]
2026-01-08 15:57:40,869 [server.py:_initialize_component()] - Performing Component Post Init: [announcements]
2026-01-08 15:57:40,895 [server.py:_initialize_component()] - Performing Component Post Init: [webcam]
2026-01-08 15:57:40,896 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 15:57:40,903 [server.py:_initialize_component()] - Performing Component Post Init: [klippy_connection]
2026-01-08 15:57:40,903 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['-.mount', 'system.slice', 'sysinit.target']
**After=['systemd-journald.socket', 'system.slice', 'sysinit.target', '-.mount', 'basic.target', 'network-online.target']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 15:57:40,903 [server.py:_initialize_component()] - Performing Component Post Init: [update_manager]
2026-01-08 15:57:41,629 [base_deploy.py:log_info()] - PackageDeploy: PackageKit Provider Configured
2026-01-08 15:57:41,632 [git_deploy.py:log_repo_info()] - Git Repo moonraker Detected:
Owner: Arksine
Repository Name: moonraker
Path: /home/luis/moonraker
Remote: origin
Branch: master
Remote URL: https://github.com/Arksine/moonraker.git
Recovery URL: https://github.com/Arksine/moonraker.git
Current Commit SHA: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Upstream Commit SHA: b3f9566b8b8863ec85a00ce424d77c8e19576c44
Current Version: v0.9.3-120-g5836eab2
Upstream Version: v0.9.3-131-gb3f9566b
Rollback Commit: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Rollback Branch: master
Rollback Version: v0.9.3-120-g5836eab2
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 11
Diverged: False
Pinned Commit: None
Repo Warnings:
  Repo has untracked source files: ['moonraker/components/timelapse.py']
2026-01-08 15:57:41,634 [git_deploy.py:log_repo_info()] - Git Repo klipper Detected:
Owner: Klipper3d
Repository Name: klipper
Path: /home/luis/klipper
Remote: origin
Branch: master
Remote URL: https://github.com/Klipper3d/klipper.git
Recovery URL: https://github.com/Klipper3d/klipper.git
Current Commit SHA: c803249467a84fe1e37e01bc02f88abb29384bab
Upstream Commit SHA: e605fd18560fbb5a7413ca12b72325ad4e18de16
Current Version: v0.13.0-320-gc8032494
Upstream Version: v0.13.0-457-ge605fd18
Rollback Commit: c803249467a84fe1e37e01bc02f88abb29384bab
Rollback Branch: master
Rollback Version: v0.13.0-320-gc8032494
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 137
Diverged: False
Pinned Commit: None
2026-01-08 15:57:41,642 [base_deploy.py:log_info()] - Web Client mainsail: Detected
Repo: mainsail-crew/mainsail
Channel: stable
Path: /home/luis/mainsail
Local Version: v2.14.0
Remote Version: v2.16.1
Valid: True
Fallback Detected: False
Pre-release: False
Download Url: https://github.com/mainsail-crew/mainsail/releases/download/v2.16.1/mainsail.zip
Download Size: 3000137
Content Type: application/zip
Rollback Version: v2.14.0
Rollback Repo: mainsail-crew/mainsail
2026-01-08 15:57:41,658 [git_deploy.py:log_repo_info()] - Git Repo mainsail-config Detected:
Owner: mainsail-crew
Repository Name: mainsail-config
Path: /home/luis/mainsail-config
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/mainsail-config.git
Recovery URL: https://github.com/mainsail-crew/mainsail-config.git
Current Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Upstream Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Current Version: v1.2.1-1-gff3869a6
Upstream Version: v1.2.1-1-gff3869a6
Rollback Commit: ff3869a621db17ce3ef660adbbd3fa321995ac42
Rollback Branch: master
Rollback Version: v1.2.1-1-gff3869a6
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 15:57:41,660 [git_deploy.py:log_repo_info()] - Git Repo crowsnest Detected:
Owner: mainsail-crew
Repository Name: crowsnest
Path: /home/luis/crowsnest
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/crowsnest.git
Recovery URL: https://github.com/mainsail-crew/crowsnest.git
Current Commit SHA: 059fa8775f60503f7aca4bb4812795997b35b142
Upstream Commit SHA: 9cc3d4af94bcc67741ddf07ac301df5de8ba23a4
Current Version: v4.1.16-1-g059fa877
Upstream Version: v4.1.17-1-g9cc3d4af
Rollback Commit: 059fa8775f60503f7aca4bb4812795997b35b142
Rollback Branch: master
Rollback Version: v4.1.16-1-g059fa877
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 6
Diverged: False
Pinned Commit: None
2026-01-08 15:57:41,663 [git_deploy.py:log_repo_info()] - Git Repo sonar Detected:
Owner: mainsail-crew
Repository Name: sonar
Path: /home/luis/sonar
Remote: origin
Branch: main
Remote URL: https://github.com/mainsail-crew/sonar.git
Recovery URL: https://github.com/mainsail-crew/sonar.git
Current Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Upstream Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Current Version: v0.2.0-0-g3fe23fef
Upstream Version: v0.2.0-0-g3fe23fef
Rollback Commit: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Rollback Branch: main
Rollback Version: v0.2.0-0-g3fe23fef
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 15:57:41,664 [base_deploy.py:log_info()] - PackageKit: Next refresh in: 6 Days, 11 Hours, 14 Minutes, 10 Seconds
2026-01-08 15:57:41,664 [base_deploy.py:log_info()] - Git Repo moonraker: Next refresh in: 6 Days, 11 Hours, 14 Minutes, 34 Seconds
2026-01-08 15:57:41,664 [base_deploy.py:log_info()] - Git Repo klipper: Next refresh in: 6 Days, 11 Hours, 14 Minutes, 57 Seconds
2026-01-08 15:57:41,664 [base_deploy.py:log_info()] - Web Client mainsail: Next refresh in: 6 Days, 11 Hours, 14 Minutes, 57 Seconds
2026-01-08 15:57:41,664 [base_deploy.py:log_info()] - Git Repo mainsail-config: Next refresh in: 6 Days, 11 Hours, 14 Minutes, 59 Seconds
2026-01-08 15:57:41,664 [base_deploy.py:log_info()] - Git Repo crowsnest: Next refresh in: 6 Days, 11 Hours, 15 Minutes
2026-01-08 15:57:41,664 [base_deploy.py:log_info()] - Git Repo sonar: Next refresh in: 6 Days, 11 Hours, 15 Minutes, 2 Seconds
2026-01-08 15:57:41,669 [extensions.py:start_unix_server()] - Creating Unix Domain Socket at '/home/luis/printer_data/comms/moonraker.sock'
2026-01-08 15:57:41,670 [server.py:start_server()] - Starting Moonraker on (0.0.0.0, 7125), Hostname: mainsailos
2026-01-08 15:57:41,672 [application.py:listen()] - SSL Certificate/Key not configured, aborting HTTPS Server startup
2026-01-08 15:57:41,924 [klippy_connection.py:_do_connect()] - Klippy Connection Established
2026-01-08 15:57:41,996 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['system.slice', '-.mount', 'sysinit.target']
**After=['systemd-journald.socket', '-.mount', 'sysinit.target', 'system.slice', 'basic.target', 'network-online.target']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 15:57:42,250 [server.py:add_log_rollover_item()] - Klipper Version: v0.13.0-320-gc80324946
2026-01-08 15:58:05,270 [authorization.py:_check_trusted_connection()] - Trusted Connection Detected, IP: 10.160.210.62
2026-01-08 15:58:05,275 [application.py:log_request()] - 101 GET /websocket (10.160.210.62) [_TRUSTED_USER_] 7.07ms
2026-01-08 15:58:05,275 [websockets.py:open()] - Websocket Opened: ID: 547559426704, Proxied: True, User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36, Host Name: 10.160.210.74
2026-01-08 15:58:05,290 [websockets.py:_handle_identify()] - Websocket 547559426704 Client Identified - Name: mainsail, Version: 2.14.0, Type: web
2026-01-08 15:58:09,955 [klippy_connection.py:_on_connection_closed()] - Klippy Connection Removed
2026-01-08 15:58:11,215 [klippy_connection.py:_do_connect()] - Klippy Connection Established
2026-01-08 15:58:36,593 [klippy_connection.py:_on_connection_closed()] - Klippy Connection Removed
2026-01-08 15:58:37,850 [klippy_connection.py:_do_connect()] - Klippy Connection Established
2026-01-08 16:00:09,847 [klippy_connection.py:_request_initial_subscriptions()] - Webhooks Subscribed
2026-01-08 16:00:09,849 [klippy_connection.py:_request_initial_subscriptions()] - GCode Output Subscribed
2026-01-08 16:00:09,853 [klippy_connection.py:_check_ready()] - 
mcu 'eddy': Unable to connect
Once the underlying issue is corrected, use the
"FIRMWARE_RESTART" command to reset the firmware, reload the
config, and restart the host software.
Error configuring printer

2026-01-08 16:02:32,081 [klippy_connection.py:_on_connection_closed()] - Klippy Connection Removed
2026-01-08 16:02:33,340 [klippy_connection.py:_do_connect()] - Klippy Connection Established
-------------------- Log Start | Thu Jan  8 16:02:29 2026 --------------------
platform: Linux-6.12.47+rpt-rpi-v8-aarch64-with-glibc2.36
data_path: /home/luis/printer_data
is_default_data_path: False
config_file: /home/luis/printer_data/config/moonraker.conf
backup_config: /home/luis/printer_data/config/.moonraker.conf.bkp
startup_warnings: []
verbose: False
debug: False
asyncio_debug: False
is_backup_config: False
is_python_package: True
instance_uuid: 3f5c60401f1a4b94a107f77b27ae0653
unix_socket_path: /home/luis/printer_data/comms/moonraker.sock
structured_logging: False
software_version: v0.9.3-120-g5836eab
git_branch: master
git_remote: origin
git_repo_url: https://github.com/Arksine/moonraker.git
modified_files: []
unofficial_components: []
log_file: /home/luis/printer_data/logs/moonraker.log
python_version: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]
launch_args: /home/luis/moonraker-env/bin/python /home/luis/moonraker/moonraker/__main__.py
msgspec_enabled: True
uvloop_enabled: True
2026-01-08 16:02:29,591 [confighelper.py:read_file()] - Configuration File '/home/luis/printer_data/config/moonraker.conf' parsed, total size: 2192 B
2026-01-08 16:02:29,591 [server.py:add_log_rollover_item()] - 
#################### Moonraker Configuration ####################

[server]
host = 0.0.0.0
port = 7125
max_upload_size = 1024
klippy_uds_address = ~/printer_data/comms/klippy.sock

[file_manager]
enable_object_processing = False

[authorization]
cors_domains = 
	https://my.mainsail.xyz
	http://my.mainsail.xyz
	http://*.local
	http://*.lan
trusted_clients = 
	10.0.0.0/8
	127.0.0.0/8
	169.254.0.0/16
	172.16.0.0/12
	192.168.0.0/16
	FE80::/10
	::1/128

[octoprint_compat]

[history]

[announcements]
subscriptions = 
	mainsail

[update_manager]
refresh_interval = 168
enable_auto_refresh = True

[update_manager mainsail]
type = web
channel = stable
repo = mainsail-crew/mainsail
path = ~/mainsail

[update_manager mainsail-config]
type = git_repo
primary_branch = master
path = ~/mainsail-config
origin = https://github.com/mainsail-crew/mainsail-config.git
managed_services = klipper

[update_manager crowsnest]
type = git_repo
path = ~/crowsnest
origin = https://github.com/mainsail-crew/crowsnest.git
managed_services = crowsnest
install_script = tools/pkglist.sh

[update_manager sonar]
type = git_repo
path = ~/sonar
origin = https://github.com/mainsail-crew/sonar.git
primary_branch = main
managed_services = sonar
system_dependencies = resources/system-dependencies.json

#################################################################
All Configuration Files:
/home/luis/printer_data/config/moonraker.conf
#################################################################
2026-01-08 16:02:30,075 [server.py:load_component()] - Component (secrets) loaded
2026-01-08 16:02:30,097 [server.py:load_component()] - Component (template) loaded
2026-01-08 16:02:30,108 [server.py:load_component()] - Component (klippy_connection) loaded
2026-01-08 16:02:33,606 [application.py:__init__()] - Detected Tornado Version 6.5.1
2026-01-08 16:02:33,609 [server.py:load_component()] - Component (application) loaded
2026-01-08 16:02:33,768 [server.py:load_component()] - Component (websockets) loaded
2026-01-08 16:02:34,069 [server.py:add_log_rollover_item()] - Loading Sqlite database provider. Sqlite Version: 3.40.1
2026-01-08 16:02:34,126 [server.py:add_log_rollover_item()] - Unsafe Shutdown Count: 3
2026-01-08 16:02:34,130 [server.py:load_component()] - Component (database) loaded
2026-01-08 16:02:35,053 [server.py:load_component()] - Component (dbus_manager) loaded
2026-01-08 16:02:35,155 [file_manager.py:__init__()] - Using File System Observer: inotify
2026-01-08 16:02:35,285 [server.py:load_component()] - Component (file_manager) loaded
2026-01-08 16:02:35,378 [database.py:register_table()] - Found registered table authorized_users
2026-01-08 16:02:35,381 [authorization.py:__init__()] - Authorization Configuration Loaded
Trusted Clients:
10.0.0.0/8
127.0.0.0/8
169.254.0.0/16
172.16.0.0/12
192.168.0.0/16
fe80::/10
::1/128
CORS Domains:
https://my\\.mainsail\\.xyz
http://my\\.mainsail\\.xyz
http://.*\\.local
http://.*\\.lan
2026-01-08 16:02:35,386 [server.py:load_component()] - Component (authorization) loaded
2026-01-08 16:02:35,411 [server.py:load_component()] - Component (klippy_apis) loaded
2026-01-08 16:02:36,070 [server.py:add_log_rollover_item()] - 
System Info:

***python***
  version: (3, 11, 2, 'final', 0)
  version_string: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]

***cpu_info***
  cpu_count: 4
  bits: 64bit
  processor: aarch64
  cpu_desc: 
  serial_number: 272b6098
  hardware_desc: 
  model: Raspberry Pi 3 Model B Plus Rev 1.3
  total_memory: 876816
  memory_units: kB

***sd_info***
  manufacturer_id: 00
  manufacturer: Unknown
  oem_id: 0000
  product_name: USD  
  product_revision: 2.0
  serial_number: 000002f8
  manufacturer_date: 5/2023
  capacity: 59.5 GiB
  total_bytes: 63908610048

***distribution***
  name: Debian GNU/Linux 12 (bookworm)
  id: debian
  version: 12
  version_parts: {'major': '12', 'minor': '', 'build_number': ''}
  like: 
  codename: bookworm
  release_info: {'name': 'MainsailOS', 'version_id': '2.2.2', 'codename': 'bookworm', 'id': 'mainsailos'}
  kernel_version: 6.12.47+rpt-rpi-v8

***virtualization***
  virt_type: none
  virt_identifier: none

***network***

***canbus***

***Allowed Services***
  klipper_mcu
  webcamd
  MoonCord
  KlipperScreen
  moonraker-telegram-bot
  moonraker-obico
  sonar
  crowsnest
  octoeverywhere
  ratos-configurator
2026-01-08 16:02:36,080 [server.py:load_component()] - Component (shell_command) loaded
2026-01-08 16:02:36,080 [machine.py:__init__()] - Using System Provider: systemd_dbus
2026-01-08 16:02:36,310 [server.py:add_log_rollover_item()] - Found libcamera Python module, version: v0.5.2+99-bfd68f78
2026-01-08 16:02:36,311 [server.py:load_component()] - Component (machine) loaded
2026-01-08 16:02:36,317 [server.py:load_component()] - Component (data_store) loaded
2026-01-08 16:02:36,322 [proc_stats.py:__init__()] - Detected 'vcgencmd', throttle checking enabled
2026-01-08 16:02:36,324 [proc_stats.py:_get_cpu_thermal_file()] - Monitoring temperature for Raspberry Pi CPU
2026-01-08 16:02:36,325 [server.py:load_component()] - Component (proc_stats) loaded
2026-01-08 16:02:36,329 [server.py:load_component()] - Component (job_state) loaded
2026-01-08 16:02:36,337 [server.py:load_component()] - Component (job_queue) loaded
2026-01-08 16:02:36,344 [database.py:register_table()] - Found registered table job_history
2026-01-08 16:02:36,345 [database.py:register_table()] - Found registered table job_totals
2026-01-08 16:02:36,348 [server.py:load_component()] - Component (history) loaded
2026-01-08 16:02:36,367 [server.py:load_component()] - Component (http_client) loaded
2026-01-08 16:02:36,377 [server.py:load_component()] - Component (announcements) loaded
2026-01-08 16:02:36,385 [server.py:load_component()] - Component (webcam) loaded
2026-01-08 16:02:36,391 [server.py:load_component()] - Component (extensions) loaded
2026-01-08 16:02:36,529 [base_deploy.py:log_info()] - Git Repo moonraker: Detected virtualenv: /home/luis/moonraker-env
2026-01-08 16:02:36,534 [base_deploy.py:log_info()] - Git Repo klipper: Detected virtualenv: /home/luis/klippy-env
2026-01-08 16:02:36,556 [server.py:load_component()] - Component (update_manager) loaded
2026-01-08 16:02:36,566 [server.py:load_component()] - Component (octoprint_compat) loaded
2026-01-08 16:02:36,566 [server.py:_initialize_component()] - Performing Component Post Init: [database]
2026-01-08 16:02:36,608 [server.py:_initialize_component()] - Performing Component Post Init: [dbus_manager]
2026-01-08 16:02:36,622 [server.py:_initialize_component()] - Performing Component Post Init: [authorization]
2026-01-08 16:02:36,625 [server.py:_initialize_component()] - Performing Component Post Init: [machine]
2026-01-08 16:02:36,627 [machine.py:validation_init()] - Installation version in database up to date
2026-01-08 16:02:37,272 [machine.py:check_virt_status()] - No Virtualization Detected
2026-01-08 16:02:37,394 [machine.py:_find_public_ip()] - Detected Local IP: 10.160.210.74
2026-01-08 16:02:37,397 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 16:02:37,471 [server.py:add_log_rollover_item()] - 
Systemd unit moonraker.service:
unit_name: moonraker.service
is_default: True
manager: systemd
Properties:
**Requires=['network-online.target', 'system.slice', 'sysinit.target']
**After=['system.slice', 'klipper.service', 'basic.target', 'network-online.target', 'systemd-journald.socket', 'sysinit.target']
**SupplementaryGroups=['moonraker-admin']
**EnvironmentFiles=/home/luis/printer_data/systemd/moonraker.env
**ExecStart=/home/luis/moonraker-env/bin/python $MOONRAKER_ARGS
**WorkingDirectory=
**FragmentPath=/etc/systemd/system/moonraker.service
**Description=API Server for Klipper SV1
**User=luis
2026-01-08 16:02:37,471 [server.py:_initialize_component()] - Performing Component Post Init: [proc_stats]
2026-01-08 16:02:37,471 [server.py:_initialize_component()] - Performing Component Post Init: [history]
2026-01-08 16:02:37,484 [server.py:_initialize_component()] - Performing Component Post Init: [announcements]
2026-01-08 16:02:37,510 [server.py:_initialize_component()] - Performing Component Post Init: [webcam]
2026-01-08 16:02:37,511 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 16:02:37,516 [server.py:_initialize_component()] - Performing Component Post Init: [klippy_connection]
2026-01-08 16:02:37,516 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['system.slice', '-.mount', 'sysinit.target']
**After=['systemd-journald.socket', '-.mount', 'sysinit.target', 'system.slice', 'basic.target', 'network-online.target']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 16:02:37,516 [server.py:_initialize_component()] - Performing Component Post Init: [update_manager]
2026-01-08 16:02:38,277 [base_deploy.py:log_info()] - PackageDeploy: PackageKit Provider Configured
2026-01-08 16:02:38,279 [git_deploy.py:log_repo_info()] - Git Repo moonraker Detected:
Owner: Arksine
Repository Name: moonraker
Path: /home/luis/moonraker
Remote: origin
Branch: master
Remote URL: https://github.com/Arksine/moonraker.git
Recovery URL: https://github.com/Arksine/moonraker.git
Current Commit SHA: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Upstream Commit SHA: b3f9566b8b8863ec85a00ce424d77c8e19576c44
Current Version: v0.9.3-120-g5836eab2
Upstream Version: v0.9.3-131-gb3f9566b
Rollback Commit: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Rollback Branch: master
Rollback Version: v0.9.3-120-g5836eab2
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 11
Diverged: False
Pinned Commit: None
Repo Warnings:
  Repo has untracked source files: ['moonraker/components/timelapse.py']
2026-01-08 16:02:38,281 [git_deploy.py:log_repo_info()] - Git Repo klipper Detected:
Owner: Klipper3d
Repository Name: klipper
Path: /home/luis/klipper
Remote: origin
Branch: master
Remote URL: https://github.com/Klipper3d/klipper.git
Recovery URL: https://github.com/Klipper3d/klipper.git
Current Commit SHA: c803249467a84fe1e37e01bc02f88abb29384bab
Upstream Commit SHA: e605fd18560fbb5a7413ca12b72325ad4e18de16
Current Version: v0.13.0-320-gc8032494
Upstream Version: v0.13.0-457-ge605fd18
Rollback Commit: c803249467a84fe1e37e01bc02f88abb29384bab
Rollback Branch: master
Rollback Version: v0.13.0-320-gc8032494
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 137
Diverged: False
Pinned Commit: None
2026-01-08 16:02:38,288 [base_deploy.py:log_info()] - Web Client mainsail: Detected
Repo: mainsail-crew/mainsail
Channel: stable
Path: /home/luis/mainsail
Local Version: v2.14.0
Remote Version: v2.16.1
Valid: True
Fallback Detected: False
Pre-release: False
Download Url: https://github.com/mainsail-crew/mainsail/releases/download/v2.16.1/mainsail.zip
Download Size: 3000137
Content Type: application/zip
Rollback Version: v2.14.0
Rollback Repo: mainsail-crew/mainsail
2026-01-08 16:02:38,292 [git_deploy.py:log_repo_info()] - Git Repo mainsail-config Detected:
Owner: mainsail-crew
Repository Name: mainsail-config
Path: /home/luis/mainsail-config
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/mainsail-config.git
Recovery URL: https://github.com/mainsail-crew/mainsail-config.git
Current Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Upstream Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Current Version: v1.2.1-1-gff3869a6
Upstream Version: v1.2.1-1-gff3869a6
Rollback Commit: ff3869a621db17ce3ef660adbbd3fa321995ac42
Rollback Branch: master
Rollback Version: v1.2.1-1-gff3869a6
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 16:02:38,294 [git_deploy.py:log_repo_info()] - Git Repo crowsnest Detected:
Owner: mainsail-crew
Repository Name: crowsnest
Path: /home/luis/crowsnest
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/crowsnest.git
Recovery URL: https://github.com/mainsail-crew/crowsnest.git
Current Commit SHA: 059fa8775f60503f7aca4bb4812795997b35b142
Upstream Commit SHA: 9cc3d4af94bcc67741ddf07ac301df5de8ba23a4
Current Version: v4.1.16-1-g059fa877
Upstream Version: v4.1.17-1-g9cc3d4af
Rollback Commit: 059fa8775f60503f7aca4bb4812795997b35b142
Rollback Branch: master
Rollback Version: v4.1.16-1-g059fa877
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 6
Diverged: False
Pinned Commit: None
2026-01-08 16:02:38,297 [git_deploy.py:log_repo_info()] - Git Repo sonar Detected:
Owner: mainsail-crew
Repository Name: sonar
Path: /home/luis/sonar
Remote: origin
Branch: main
Remote URL: https://github.com/mainsail-crew/sonar.git
Recovery URL: https://github.com/mainsail-crew/sonar.git
Current Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Upstream Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Current Version: v0.2.0-0-g3fe23fef
Upstream Version: v0.2.0-0-g3fe23fef
Rollback Commit: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Rollback Branch: main
Rollback Version: v0.2.0-0-g3fe23fef
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 16:02:38,298 [base_deploy.py:log_info()] - PackageKit: Next refresh in: 6 Days, 11 Hours, 9 Minutes, 13 Seconds
2026-01-08 16:02:38,298 [base_deploy.py:log_info()] - Git Repo moonraker: Next refresh in: 6 Days, 11 Hours, 9 Minutes, 37 Seconds
2026-01-08 16:02:38,298 [base_deploy.py:log_info()] - Git Repo klipper: Next refresh in: 6 Days, 11 Hours, 10 Minutes
2026-01-08 16:02:38,298 [base_deploy.py:log_info()] - Web Client mainsail: Next refresh in: 6 Days, 11 Hours, 10 Minutes, 1 Second
2026-01-08 16:02:38,298 [base_deploy.py:log_info()] - Git Repo mainsail-config: Next refresh in: 6 Days, 11 Hours, 10 Minutes, 2 Seconds
2026-01-08 16:02:38,298 [base_deploy.py:log_info()] - Git Repo crowsnest: Next refresh in: 6 Days, 11 Hours, 10 Minutes, 4 Seconds
2026-01-08 16:02:38,298 [base_deploy.py:log_info()] - Git Repo sonar: Next refresh in: 6 Days, 11 Hours, 10 Minutes, 5 Seconds
2026-01-08 16:02:38,303 [extensions.py:start_unix_server()] - Creating Unix Domain Socket at '/home/luis/printer_data/comms/moonraker.sock'
2026-01-08 16:02:38,304 [server.py:start_server()] - Starting Moonraker on (0.0.0.0, 7125), Hostname: mainsailos
2026-01-08 16:02:38,306 [application.py:listen()] - SSL Certificate/Key not configured, aborting HTTPS Server startup
2026-01-08 16:02:38,557 [klippy_connection.py:_do_connect()] - Klippy Connection Established
2026-01-08 16:02:38,629 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['system.slice', 'sysinit.target', '-.mount']
**After=['sysinit.target', '-.mount', 'basic.target', 'network-online.target', 'systemd-journald.socket', 'system.slice']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 16:02:38,882 [server.py:add_log_rollover_item()] - Klipper Version: v0.13.0-320-gc80324946
2026-01-08 16:02:38,918 [authorization.py:_check_trusted_connection()] - Trusted Connection Detected, IP: 10.160.210.62
2026-01-08 16:02:38,922 [application.py:log_request()] - 101 GET /websocket (10.160.210.62) [_TRUSTED_USER_] 5.31ms
2026-01-08 16:02:38,922 [websockets.py:open()] - Websocket Opened: ID: 547918040272, Proxied: True, User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36, Host Name: 10.160.210.74
2026-01-08 16:02:38,929 [websockets.py:_handle_identify()] - Websocket 547918040272 Client Identified - Name: mainsail, Version: 2.14.0, Type: web
2026-01-08 16:05:50,680 [klippy_connection.py:_request_initial_subscriptions()] - Webhooks Subscribed
2026-01-08 16:05:50,683 [klippy_connection.py:_request_initial_subscriptions()] - GCode Output Subscribed
2026-01-08 16:05:50,687 [klippy_connection.py:_check_ready()] - 
mcu 'eddy': Unable to connect
Once the underlying issue is corrected, use the
"FIRMWARE_RESTART" command to reset the firmware, reload the
config, and restart the host software.
Error configuring printer

                                                                                                                                                                                                                                                                                                                                                     -------------------- Log Start | Thu Jan  8 16:32:34 2026 --------------------
platform: Linux-6.12.47+rpt-rpi-v8-aarch64-with-glibc2.36
data_path: /home/luis/printer_data
is_default_data_path: False
config_file: /home/luis/printer_data/config/moonraker.conf
backup_config: /home/luis/printer_data/config/.moonraker.conf.bkp
startup_warnings: []
verbose: False
debug: False
asyncio_debug: False
is_backup_config: False
is_python_package: True
instance_uuid: 3f5c60401f1a4b94a107f77b27ae0653
unix_socket_path: /home/luis/printer_data/comms/moonraker.sock
structured_logging: False
software_version: v0.9.3-120-g5836eab
git_branch: master
git_remote: origin
git_repo_url: https://github.com/Arksine/moonraker.git
modified_files: []
unofficial_components: []
log_file: /home/luis/printer_data/logs/moonraker.log
python_version: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]
launch_args: /home/luis/moonraker-env/bin/python /home/luis/moonraker/moonraker/__main__.py
msgspec_enabled: True
uvloop_enabled: True
2026-01-08 16:32:34,987 [confighelper.py:read_file()] - Configuration File '/home/luis/printer_data/config/moonraker.conf' parsed, total size: 2192 B
2026-01-08 16:32:34,987 [server.py:add_log_rollover_item()] - 
#################### Moonraker Configuration ####################

[server]
host = 0.0.0.0
port = 7125
max_upload_size = 1024
klippy_uds_address = ~/printer_data/comms/klippy.sock

[file_manager]
enable_object_processing = False

[authorization]
cors_domains = 
	https://my.mainsail.xyz
	http://my.mainsail.xyz
	http://*.local
	http://*.lan
trusted_clients = 
	10.0.0.0/8
	127.0.0.0/8
	169.254.0.0/16
	172.16.0.0/12
	192.168.0.0/16
	FE80::/10
	::1/128

[octoprint_compat]

[history]

[announcements]
subscriptions = 
	mainsail

[update_manager]
refresh_interval = 168
enable_auto_refresh = True

[update_manager mainsail]
type = web
channel = stable
repo = mainsail-crew/mainsail
path = ~/mainsail

[update_manager mainsail-config]
type = git_repo
primary_branch = master
path = ~/mainsail-config
origin = https://github.com/mainsail-crew/mainsail-config.git
managed_services = klipper

[update_manager crowsnest]
type = git_repo
path = ~/crowsnest
origin = https://github.com/mainsail-crew/crowsnest.git
managed_services = crowsnest
install_script = tools/pkglist.sh

[update_manager sonar]
type = git_repo
path = ~/sonar
origin = https://github.com/mainsail-crew/sonar.git
primary_branch = main
managed_services = sonar
system_dependencies = resources/system-dependencies.json

#################################################################
All Configuration Files:
/home/luis/printer_data/config/moonraker.conf
#################################################################
2026-01-08 16:32:35,491 [server.py:load_component()] - Component (secrets) loaded
2026-01-08 16:32:35,512 [server.py:load_component()] - Component (template) loaded
2026-01-08 16:32:35,523 [server.py:load_component()] - Component (klippy_connection) loaded
2026-01-08 16:32:39,199 [application.py:__init__()] - Detected Tornado Version 6.5.1
2026-01-08 16:32:39,203 [server.py:load_component()] - Component (application) loaded
2026-01-08 16:32:39,316 [server.py:load_component()] - Component (websockets) loaded
2026-01-08 16:32:39,595 [server.py:add_log_rollover_item()] - Loading Sqlite database provider. Sqlite Version: 3.40.1
2026-01-08 16:32:39,649 [server.py:add_log_rollover_item()] - Unsafe Shutdown Count: 4
2026-01-08 16:32:39,653 [server.py:load_component()] - Component (database) loaded
2026-01-08 16:32:40,547 [server.py:load_component()] - Component (dbus_manager) loaded
2026-01-08 16:32:40,623 [file_manager.py:__init__()] - Using File System Observer: inotify
2026-01-08 16:32:40,765 [server.py:load_component()] - Component (file_manager) loaded
2026-01-08 16:32:40,874 [database.py:register_table()] - Found registered table authorized_users
2026-01-08 16:32:40,878 [authorization.py:__init__()] - Authorization Configuration Loaded
Trusted Clients:
10.0.0.0/8
127.0.0.0/8
169.254.0.0/16
172.16.0.0/12
192.168.0.0/16
fe80::/10
::1/128
CORS Domains:
https://my\\.mainsail\\.xyz
http://my\\.mainsail\\.xyz
http://.*\\.local
http://.*\\.lan
2026-01-08 16:32:40,882 [server.py:load_component()] - Component (authorization) loaded
2026-01-08 16:32:40,903 [server.py:load_component()] - Component (klippy_apis) loaded
2026-01-08 16:32:41,506 [server.py:add_log_rollover_item()] - 
System Info:

***python***
  version: (3, 11, 2, 'final', 0)
  version_string: 3.11.2 (main, Apr 28 2025, 14:11:48) [GCC 12.2.0]

***cpu_info***
  cpu_count: 4
  bits: 64bit
  processor: aarch64
  cpu_desc: 
  serial_number: 272b6098
  hardware_desc: 
  model: Raspberry Pi 3 Model B Plus Rev 1.3
  total_memory: 876816
  memory_units: kB

***sd_info***
  manufacturer_id: 00
  manufacturer: Unknown
  oem_id: 0000
  product_name: USD  
  product_revision: 2.0
  serial_number: 000002f8
  manufacturer_date: 5/2023
  capacity: 59.5 GiB
  total_bytes: 63908610048

***distribution***
  name: Debian GNU/Linux 12 (bookworm)
  id: debian
  version: 12
  version_parts: {'major': '12', 'minor': '', 'build_number': ''}
  like: 
  codename: bookworm
  release_info: {'name': 'MainsailOS', 'version_id': '2.2.2', 'codename': 'bookworm', 'id': 'mainsailos'}
  kernel_version: 6.12.47+rpt-rpi-v8

***virtualization***
  virt_type: none
  virt_identifier: none

***network***

***canbus***

***Allowed Services***
  klipper_mcu
  webcamd
  MoonCord
  KlipperScreen
  moonraker-telegram-bot
  moonraker-obico
  sonar
  crowsnest
  octoeverywhere
  ratos-configurator
2026-01-08 16:32:41,515 [server.py:load_component()] - Component (shell_command) loaded
2026-01-08 16:32:41,516 [machine.py:__init__()] - Using System Provider: systemd_dbus
2026-01-08 16:32:41,735 [server.py:add_log_rollover_item()] - Found libcamera Python module, version: v0.5.2+99-bfd68f78
2026-01-08 16:32:41,735 [server.py:load_component()] - Component (machine) loaded
2026-01-08 16:32:41,741 [server.py:load_component()] - Component (data_store) loaded
2026-01-08 16:32:41,747 [proc_stats.py:__init__()] - Detected 'vcgencmd', throttle checking enabled
2026-01-08 16:32:41,748 [proc_stats.py:_get_cpu_thermal_file()] - Monitoring temperature for Raspberry Pi CPU
2026-01-08 16:32:41,750 [server.py:load_component()] - Component (proc_stats) loaded
2026-01-08 16:32:41,753 [server.py:load_component()] - Component (job_state) loaded
2026-01-08 16:32:41,761 [server.py:load_component()] - Component (job_queue) loaded
2026-01-08 16:32:41,769 [database.py:register_table()] - Found registered table job_history
2026-01-08 16:32:41,769 [database.py:register_table()] - Found registered table job_totals
2026-01-08 16:32:41,772 [server.py:load_component()] - Component (history) loaded
2026-01-08 16:32:41,790 [server.py:load_component()] - Component (http_client) loaded
2026-01-08 16:32:41,800 [server.py:load_component()] - Component (announcements) loaded
2026-01-08 16:32:41,809 [server.py:load_component()] - Component (webcam) loaded
2026-01-08 16:32:41,814 [server.py:load_component()] - Component (extensions) loaded
2026-01-08 16:32:41,824 [server.py:load_component()] - Component (octoprint_compat) loaded
2026-01-08 16:32:41,962 [base_deploy.py:log_info()] - Git Repo moonraker: Detected virtualenv: /home/luis/moonraker-env
2026-01-08 16:32:41,967 [base_deploy.py:log_info()] - Git Repo klipper: Detected virtualenv: /home/luis/klippy-env
2026-01-08 16:32:41,987 [server.py:load_component()] - Component (update_manager) loaded
2026-01-08 16:32:41,988 [server.py:_initialize_component()] - Performing Component Post Init: [database]
2026-01-08 16:32:42,026 [server.py:_initialize_component()] - Performing Component Post Init: [dbus_manager]
2026-01-08 16:32:42,040 [server.py:_initialize_component()] - Performing Component Post Init: [authorization]
2026-01-08 16:32:42,042 [server.py:_initialize_component()] - Performing Component Post Init: [machine]
2026-01-08 16:32:42,044 [machine.py:validation_init()] - Installation version in database up to date
2026-01-08 16:32:42,733 [machine.py:check_virt_status()] - No Virtualization Detected
2026-01-08 16:32:42,855 [machine.py:_find_public_ip()] - Detected Local IP: 10.160.210.74
2026-01-08 16:32:42,857 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 16:32:42,929 [server.py:add_log_rollover_item()] - 
Systemd unit moonraker.service:
unit_name: moonraker.service
is_default: True
manager: systemd
Properties:
**Requires=['system.slice', 'network-online.target', 'sysinit.target']
**After=['sysinit.target', 'basic.target', 'network-online.target', 'system.slice', 'klipper.service', 'systemd-journald.socket']
**SupplementaryGroups=['moonraker-admin']
**EnvironmentFiles=/home/luis/printer_data/systemd/moonraker.env
**ExecStart=/home/luis/moonraker-env/bin/python $MOONRAKER_ARGS
**WorkingDirectory=
**FragmentPath=/etc/systemd/system/moonraker.service
**Description=API Server for Klipper SV1
**User=luis
2026-01-08 16:32:42,930 [server.py:_initialize_component()] - Performing Component Post Init: [proc_stats]
2026-01-08 16:32:42,930 [server.py:_initialize_component()] - Performing Component Post Init: [history]
2026-01-08 16:32:42,937 [server.py:_initialize_component()] - Performing Component Post Init: [announcements]
2026-01-08 16:32:42,944 [server.py:_initialize_component()] - Performing Component Post Init: [webcam]
2026-01-08 16:32:42,944 [webcam.py:_set_default_host_ip()] - Default public webcam address set: http://10.160.210.74
2026-01-08 16:32:42,950 [server.py:_initialize_component()] - Performing Component Post Init: [klippy_connection]
2026-01-08 16:32:42,951 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['system.slice', 'sysinit.target', '-.mount']
**After=['sysinit.target', '-.mount', 'basic.target', 'network-online.target', 'systemd-journald.socket', 'system.slice']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 16:32:42,951 [server.py:_initialize_component()] - Performing Component Post Init: [update_manager]
2026-01-08 16:32:43,730 [base_deploy.py:log_info()] - PackageDeploy: PackageKit Provider Configured
2026-01-08 16:32:43,733 [git_deploy.py:log_repo_info()] - Git Repo moonraker Detected:
Owner: Arksine
Repository Name: moonraker
Path: /home/luis/moonraker
Remote: origin
Branch: master
Remote URL: https://github.com/Arksine/moonraker.git
Recovery URL: https://github.com/Arksine/moonraker.git
Current Commit SHA: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Upstream Commit SHA: b3f9566b8b8863ec85a00ce424d77c8e19576c44
Current Version: v0.9.3-120-g5836eab2
Upstream Version: v0.9.3-131-gb3f9566b
Rollback Commit: 5836eab233bc0b88c9fcf692a1e926939d3f68e3
Rollback Branch: master
Rollback Version: v0.9.3-120-g5836eab2
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 11
Diverged: False
Pinned Commit: None
Repo Warnings:
  Repo has untracked source files: ['moonraker/components/timelapse.py']
2026-01-08 16:32:43,735 [git_deploy.py:log_repo_info()] - Git Repo klipper Detected:
Owner: Klipper3d
Repository Name: klipper
Path: /home/luis/klipper
Remote: origin
Branch: master
Remote URL: https://github.com/Klipper3d/klipper.git
Recovery URL: https://github.com/Klipper3d/klipper.git
Current Commit SHA: c803249467a84fe1e37e01bc02f88abb29384bab
Upstream Commit SHA: e605fd18560fbb5a7413ca12b72325ad4e18de16
Current Version: v0.13.0-320-gc8032494
Upstream Version: v0.13.0-457-ge605fd18
Rollback Commit: c803249467a84fe1e37e01bc02f88abb29384bab
Rollback Branch: master
Rollback Version: v0.13.0-320-gc8032494
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 137
Diverged: False
Pinned Commit: None
2026-01-08 16:32:43,742 [base_deploy.py:log_info()] - Web Client mainsail: Detected
Repo: mainsail-crew/mainsail
Channel: stable
Path: /home/luis/mainsail
Local Version: v2.14.0
Remote Version: v2.16.1
Valid: True
Fallback Detected: False
Pre-release: False
Download Url: https://github.com/mainsail-crew/mainsail/releases/download/v2.16.1/mainsail.zip
Download Size: 3000137
Content Type: application/zip
Rollback Version: v2.14.0
Rollback Repo: mainsail-crew/mainsail
2026-01-08 16:32:43,746 [git_deploy.py:log_repo_info()] - Git Repo mainsail-config Detected:
Owner: mainsail-crew
Repository Name: mainsail-config
Path: /home/luis/mainsail-config
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/mainsail-config.git
Recovery URL: https://github.com/mainsail-crew/mainsail-config.git
Current Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Upstream Commit SHA: ff3869a621db17ce3ef660adbbd3fa321995ac42
Current Version: v1.2.1-1-gff3869a6
Upstream Version: v1.2.1-1-gff3869a6
Rollback Commit: ff3869a621db17ce3ef660adbbd3fa321995ac42
Rollback Branch: master
Rollback Version: v1.2.1-1-gff3869a6
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 16:32:43,748 [git_deploy.py:log_repo_info()] - Git Repo crowsnest Detected:
Owner: mainsail-crew
Repository Name: crowsnest
Path: /home/luis/crowsnest
Remote: origin
Branch: master
Remote URL: https://github.com/mainsail-crew/crowsnest.git
Recovery URL: https://github.com/mainsail-crew/crowsnest.git
Current Commit SHA: 059fa8775f60503f7aca4bb4812795997b35b142
Upstream Commit SHA: 9cc3d4af94bcc67741ddf07ac301df5de8ba23a4
Current Version: v4.1.16-1-g059fa877
Upstream Version: v4.1.17-1-g9cc3d4af
Rollback Commit: 059fa8775f60503f7aca4bb4812795997b35b142
Rollback Branch: master
Rollback Version: v4.1.16-1-g059fa877
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 6
Diverged: False
Pinned Commit: None
2026-01-08 16:32:43,751 [git_deploy.py:log_repo_info()] - Git Repo sonar Detected:
Owner: mainsail-crew
Repository Name: sonar
Path: /home/luis/sonar
Remote: origin
Branch: main
Remote URL: https://github.com/mainsail-crew/sonar.git
Recovery URL: https://github.com/mainsail-crew/sonar.git
Current Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Upstream Commit SHA: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Current Version: v0.2.0-0-g3fe23fef
Upstream Version: v0.2.0-0-g3fe23fef
Rollback Commit: 3fe23fef07dbc19a9b66bdd111bbd1d574d19955
Rollback Branch: main
Rollback Version: v0.2.0-0-g3fe23fef
Is Dirty: False
Is Detached: False
Is Shallow: False
Commits Behind Count: 0
Diverged: False
Pinned Commit: None
2026-01-08 16:32:43,752 [base_deploy.py:log_info()] - PackageKit: Next refresh in: 6 Days, 10 Hours, 39 Minutes, 8 Seconds
2026-01-08 16:32:43,752 [base_deploy.py:log_info()] - Git Repo moonraker: Next refresh in: 6 Days, 10 Hours, 39 Minutes, 32 Seconds
2026-01-08 16:32:43,752 [base_deploy.py:log_info()] - Git Repo klipper: Next refresh in: 6 Days, 10 Hours, 39 Minutes, 55 Seconds
2026-01-08 16:32:43,752 [base_deploy.py:log_info()] - Web Client mainsail: Next refresh in: 6 Days, 10 Hours, 39 Minutes, 55 Seconds
2026-01-08 16:32:43,752 [base_deploy.py:log_info()] - Git Repo mainsail-config: Next refresh in: 6 Days, 10 Hours, 39 Minutes, 56 Seconds
2026-01-08 16:32:43,752 [base_deploy.py:log_info()] - Git Repo crowsnest: Next refresh in: 6 Days, 10 Hours, 39 Minutes, 58 Seconds
2026-01-08 16:32:43,752 [base_deploy.py:log_info()] - Git Repo sonar: Next refresh in: 6 Days, 10 Hours, 40 Minutes
2026-01-08 16:32:43,757 [extensions.py:start_unix_server()] - Creating Unix Domain Socket at '/home/luis/printer_data/comms/moonraker.sock'
2026-01-08 16:32:43,758 [server.py:start_server()] - Starting Moonraker on (0.0.0.0, 7125), Hostname: mainsailos
2026-01-08 16:32:43,759 [application.py:listen()] - SSL Certificate/Key not configured, aborting HTTPS Server startup
2026-01-08 16:32:44,011 [klippy_connection.py:_do_connect()] - Klippy Connection Established
2026-01-08 16:32:44,082 [server.py:add_log_rollover_item()] - 
Systemd unit klipper.service:
unit_name: klipper.service
is_default: True
manager: systemd
Properties:
**Requires=['sysinit.target', '-.mount', 'system.slice']
**After=['network-online.target', 'sysinit.target', 'basic.target', '-.mount', 'system.slice', 'systemd-journald.socket']
**SupplementaryGroups=[]
**EnvironmentFiles=/home/luis/printer_data/systemd/klipper.env
**ExecStart=/home/luis/klippy-env/bin/python $KLIPPER_ARGS
**WorkingDirectory=/home/luis/klipper
**FragmentPath=/etc/systemd/system/klipper.service
**Description=Klipper 3D Printer Firmware SV1
**User=luis
2026-01-08 16:32:44,334 [server.py:add_log_rollover_item()] - Klipper Version: v0.13.0-320-gc80324946
`,
    dmesg: `[Thu Jan  8 16:32:00 2026] Booting Linux on physical CPU 0x0000000000 [0x410fd034]
[Thu Jan  8 16:32:00 2026] Linux version 6.12.47+rpt-rpi-v8 (serge@raspberrypi.com) (aarch64-linux-gnu-gcc-12 (Debian 12.2.0-14+deb12u1) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT Debian 1:6.12.47-1+rpt1~bookworm (2025-09-16)
[Thu Jan  8 16:32:00 2026] KASLR enabled
[Thu Jan  8 16:32:00 2026] random: crng init done
[Thu Jan  8 16:32:00 2026] Machine model: Raspberry Pi 3 Model B Plus Rev 1.3
[Thu Jan  8 16:32:00 2026] efi: UEFI not found.
[Thu Jan  8 16:32:00 2026] Reserved memory: created CMA memory pool at 0x000000001e400000, size 256 MiB
[Thu Jan  8 16:32:00 2026] OF: reserved mem: initialized node linux,cma, compatible id shared-dma-pool
[Thu Jan  8 16:32:00 2026] OF: reserved mem: 0x000000001e400000..0x000000002e3fffff (262144 KiB) map reusable linux,cma
[Thu Jan  8 16:32:00 2026] NUMA: Faking a node at [mem 0x0000000000000000-0x0000000037ffffff]
[Thu Jan  8 16:32:00 2026] NODE_DATA(0) allocated [mem 0x37e16780-0x37e1947f]
[Thu Jan  8 16:32:00 2026] Zone ranges:
[Thu Jan  8 16:32:00 2026]   DMA      [mem 0x0000000000000000-0x0000000037ffffff]
[Thu Jan  8 16:32:00 2026]   DMA32    empty
[Thu Jan  8 16:32:00 2026]   Normal   empty
[Thu Jan  8 16:32:00 2026] Movable zone start for each node
[Thu Jan  8 16:32:00 2026] Early memory node ranges
[Thu Jan  8 16:32:00 2026]   node   0: [mem 0x0000000000000000-0x0000000037ffffff]
[Thu Jan  8 16:32:00 2026] Initmem setup node 0 [mem 0x0000000000000000-0x0000000037ffffff]
[Thu Jan  8 16:32:00 2026] percpu: Embedded 33 pages/cpu s95192 r8192 d31784 u135168
[Thu Jan  8 16:32:00 2026] pcpu-alloc: s95192 r8192 d31784 u135168 alloc=33*4096
[Thu Jan  8 16:32:00 2026] pcpu-alloc: [0] 0 [0] 1 [0] 2 [0] 3 
[Thu Jan  8 16:32:00 2026] Detected VIPT I-cache on CPU0
[Thu Jan  8 16:32:00 2026] CPU features: kernel page table isolation forced ON by KASLR
[Thu Jan  8 16:32:00 2026] CPU features: detected: Kernel page table isolation (KPTI)
[Thu Jan  8 16:32:00 2026] CPU features: detected: ARM erratum 843419
[Thu Jan  8 16:32:00 2026] CPU features: detected: ARM erratum 845719
[Thu Jan  8 16:32:00 2026] alternatives: applying boot alternatives
[Thu Jan  8 16:32:00 2026] Kernel command line: coherent_pool=1M 8250.nr_uarts=1 snd_bcm2835.enable_headphones=0 cgroup_disable=memory snd_bcm2835.enable_headphones=1 snd_bcm2835.enable_hdmi=1 snd_bcm2835.enable_hdmi=0  vc_mem.mem_base=0x3ec00000 vc_mem.mem_size=0x40000000  console=tty1 root=PARTUUID=a233995b-02 rootfstype=ext4 fsck.repair=yes rootwait cfg80211.ieee80211_regdom=ES
[Thu Jan  8 16:32:00 2026] cgroup: Disabling memory control group subsystem
[Thu Jan  8 16:32:00 2026] Dentry cache hash table entries: 131072 (order: 8, 1048576 bytes, linear)
[Thu Jan  8 16:32:00 2026] Inode-cache hash table entries: 65536 (order: 7, 524288 bytes, linear)
[Thu Jan  8 16:32:00 2026] Fallback order for Node 0: 0 
[Thu Jan  8 16:32:00 2026] Built 1 zonelists, mobility grouping on.  Total pages: 229376
[Thu Jan  8 16:32:00 2026] Policy zone: DMA
[Thu Jan  8 16:32:00 2026] mem auto-init: stack:all(zero), heap alloc:off, heap free:off
[Thu Jan  8 16:32:00 2026] SLUB: HWalign=64, Order=0-3, MinObjects=0, CPUs=4, Nodes=1
[Thu Jan  8 16:32:00 2026] ftrace: allocating 45290 entries in 177 pages
[Thu Jan  8 16:32:00 2026] ftrace: allocated 177 pages with 4 groups
[Thu Jan  8 16:32:00 2026] rcu: Preemptible hierarchical RCU implementation.
[Thu Jan  8 16:32:00 2026] rcu: 	RCU event tracing is enabled.
[Thu Jan  8 16:32:00 2026] 	Trampoline variant of Tasks RCU enabled.
[Thu Jan  8 16:32:00 2026] 	Rude variant of Tasks RCU enabled.
[Thu Jan  8 16:32:00 2026] 	Tracing variant of Tasks RCU enabled.
[Thu Jan  8 16:32:00 2026] rcu: RCU calculated value of scheduler-enlistment delay is 25 jiffies.
[Thu Jan  8 16:32:00 2026] RCU Tasks: Setting shift to 2 and lim to 1 rcu_task_cb_adjust=1 rcu_task_cpu_ids=4.
[Thu Jan  8 16:32:00 2026] RCU Tasks Rude: Setting shift to 2 and lim to 1 rcu_task_cb_adjust=1 rcu_task_cpu_ids=4.
[Thu Jan  8 16:32:00 2026] RCU Tasks Trace: Setting shift to 2 and lim to 1 rcu_task_cb_adjust=1 rcu_task_cpu_ids=4.
[Thu Jan  8 16:32:00 2026] NR_IRQS: 64, nr_irqs: 64, preallocated irqs: 0
[Thu Jan  8 16:32:00 2026] Root IRQ handler: bcm2836_arm_irqchip_handle_irq
[Thu Jan  8 16:32:00 2026] rcu: srcu_init: Setting srcu_struct sizes based on contention.
[Thu Jan  8 16:32:00 2026] arch_timer: cp15 timer(s) running at 19.20MHz (phys).
[Thu Jan  8 16:32:00 2026] clocksource: arch_sys_counter: mask: 0xffffffffffffff max_cycles: 0x46d987e47, max_idle_ns: 440795202767 ns
[Thu Jan  8 16:32:00 2026] sched_clock: 56 bits at 19MHz, resolution 52ns, wraps every 4398046511078ns
[Thu Jan  8 16:32:00 2026] Console: colour dummy device 80x25
[Thu Jan  8 16:32:00 2026] printk: legacy console [tty1] enabled
[Thu Jan  8 16:32:00 2026] Calibrating delay loop (skipped), value calculated using timer frequency.. 38.40 BogoMIPS (lpj=76800)
[Thu Jan  8 16:32:00 2026] pid_max: default: 32768 minimum: 301
[Thu Jan  8 16:32:00 2026] LSM: initializing lsm=capability
[Thu Jan  8 16:32:00 2026] Mount-cache hash table entries: 2048 (order: 2, 16384 bytes, linear)
[Thu Jan  8 16:32:00 2026] Mountpoint-cache hash table entries: 2048 (order: 2, 16384 bytes, linear)
[Thu Jan  8 16:32:00 2026] rcu: Hierarchical SRCU implementation.
[Thu Jan  8 16:32:00 2026] rcu: 	Max phase no-delay instances is 1000.
[Thu Jan  8 16:32:00 2026] Timer migration: 1 hierarchy levels; 8 children per group; 1 crossnode level
[Thu Jan  8 16:32:00 2026] EFI services will not be available.
[Thu Jan  8 16:32:00 2026] smp: Bringing up secondary CPUs ...
[Thu Jan  8 16:32:00 2026] Detected VIPT I-cache on CPU1
[Thu Jan  8 16:32:00 2026] CPU1: Booted secondary processor 0x0000000001 [0x410fd034]
[Thu Jan  8 16:32:00 2026] Detected VIPT I-cache on CPU2
[Thu Jan  8 16:32:00 2026] CPU2: Booted secondary processor 0x0000000002 [0x410fd034]
[Thu Jan  8 16:32:00 2026] Detected VIPT I-cache on CPU3
[Thu Jan  8 16:32:00 2026] CPU3: Booted secondary processor 0x0000000003 [0x410fd034]
[Thu Jan  8 16:32:00 2026] smp: Brought up 1 node, 4 CPUs
[Thu Jan  8 16:32:00 2026] SMP: Total of 4 processors activated.
[Thu Jan  8 16:32:00 2026] CPU: All CPU(s) started at EL2
[Thu Jan  8 16:32:00 2026] CPU features: detected: 32-bit EL0 Support
[Thu Jan  8 16:32:00 2026] CPU features: detected: 32-bit EL1 Support
[Thu Jan  8 16:32:00 2026] CPU features: detected: CRC32 instructions
[Thu Jan  8 16:32:00 2026] alternatives: applying system-wide alternatives
[Thu Jan  8 16:32:00 2026] Memory: 592624K/917504K available (14208K kernel code, 2406K rwdata, 4824K rodata, 5440K init, 577K bss, 57776K reserved, 262144K cma-reserved)
[Thu Jan  8 16:32:00 2026] devtmpfs: initialized
[Thu Jan  8 16:32:00 2026] Enabled cp15_barrier support
[Thu Jan  8 16:32:00 2026] Enabled setend support
[Thu Jan  8 16:32:00 2026] clocksource: jiffies: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 7645041785100000 ns
[Thu Jan  8 16:32:00 2026] futex hash table entries: 1024 (order: 4, 65536 bytes, linear)
[Thu Jan  8 16:32:00 2026] 2G module region forced by RANDOMIZE_MODULE_REGION_FULL
[Thu Jan  8 16:32:00 2026] 0 pages in range for non-PLT usage
[Thu Jan  8 16:32:00 2026] 517360 pages in range for PLT usage
[Thu Jan  8 16:32:00 2026] pinctrl core: initialized pinctrl subsystem
[Thu Jan  8 16:32:00 2026] DMI not present or invalid.
[Thu Jan  8 16:32:00 2026] NET: Registered PF_NETLINK/PF_ROUTE protocol family
[Thu Jan  8 16:32:00 2026] DMA: preallocated 1024 KiB GFP_KERNEL pool for atomic allocations
[Thu Jan  8 16:32:00 2026] DMA: preallocated 1024 KiB GFP_KERNEL|GFP_DMA pool for atomic allocations
[Thu Jan  8 16:32:00 2026] DMA: preallocated 1024 KiB GFP_KERNEL|GFP_DMA32 pool for atomic allocations
[Thu Jan  8 16:32:00 2026] audit: initializing netlink subsys (disabled)
[Thu Jan  8 16:32:00 2026] audit: type=2000 audit(0.028:1): state=initialized audit_enabled=0 res=1
[Thu Jan  8 16:32:00 2026] thermal_sys: Registered thermal governor 'step_wise'
[Thu Jan  8 16:32:00 2026] cpuidle: using governor menu
[Thu Jan  8 16:32:00 2026] hw-breakpoint: found 6 breakpoint and 4 watchpoint registers.
[Thu Jan  8 16:32:00 2026] ASID allocator initialised with 32768 entries
[Thu Jan  8 16:32:00 2026] Serial: AMBA PL011 UART driver
[Thu Jan  8 16:32:00 2026] bcm2835-mbox 3f00b880.mailbox: mailbox enabled
[Thu Jan  8 16:32:00 2026] raspberrypi-firmware soc:firmware: Attached to firmware from 2025-08-20T17:04:09, variant start
[Thu Jan  8 16:32:00 2026] raspberrypi-firmware soc:firmware: Firmware hash is cd866525580337c0aee4b25880e1f5f9f674fb24
[Thu Jan  8 16:32:00 2026] bcm2835-dma 3f007000.dma-controller: DMA legacy API manager, dmachans=0x1
[Thu Jan  8 16:32:00 2026] iommu: Default domain type: Translated
[Thu Jan  8 16:32:00 2026] iommu: DMA domain TLB invalidation policy: strict mode
[Thu Jan  8 16:32:00 2026] SCSI subsystem initialized
[Thu Jan  8 16:32:00 2026] usbcore: registered new interface driver usbfs
[Thu Jan  8 16:32:00 2026] usbcore: registered new interface driver hub
[Thu Jan  8 16:32:00 2026] usbcore: registered new device driver usb
[Thu Jan  8 16:32:00 2026] pps_core: LinuxPPS API ver. 1 registered
[Thu Jan  8 16:32:00 2026] pps_core: Software ver. 5.3.6 - Copyright 2005-2007 Rodolfo Giometti <giometti@linux.it>
[Thu Jan  8 16:32:00 2026] PTP clock support registered
[Thu Jan  8 16:32:00 2026] vgaarb: loaded
[Thu Jan  8 16:32:00 2026] clocksource: Switched to clocksource arch_sys_counter
[Thu Jan  8 16:32:00 2026] VFS: Disk quotas dquot_6.6.0
[Thu Jan  8 16:32:00 2026] VFS: Dquot-cache hash table entries: 512 (order 0, 4096 bytes)
[Thu Jan  8 16:32:00 2026] NET: Registered PF_INET protocol family
[Thu Jan  8 16:32:00 2026] IP idents hash table entries: 16384 (order: 5, 131072 bytes, linear)
[Thu Jan  8 16:32:00 2026] tcp_listen_portaddr_hash hash table entries: 512 (order: 1, 8192 bytes, linear)
[Thu Jan  8 16:32:00 2026] Table-perturb hash table entries: 65536 (order: 6, 262144 bytes, linear)
[Thu Jan  8 16:32:00 2026] TCP established hash table entries: 8192 (order: 4, 65536 bytes, linear)
[Thu Jan  8 16:32:00 2026] TCP bind hash table entries: 8192 (order: 6, 262144 bytes, linear)
[Thu Jan  8 16:32:00 2026] TCP: Hash tables configured (established 8192 bind 8192)
[Thu Jan  8 16:32:00 2026] MPTCP token hash table entries: 1024 (order: 2, 24576 bytes, linear)
[Thu Jan  8 16:32:00 2026] UDP hash table entries: 512 (order: 2, 16384 bytes, linear)
[Thu Jan  8 16:32:00 2026] UDP-Lite hash table entries: 512 (order: 2, 16384 bytes, linear)
[Thu Jan  8 16:32:00 2026] NET: Registered PF_UNIX/PF_LOCAL protocol family
[Thu Jan  8 16:32:00 2026] RPC: Registered named UNIX socket transport module.
[Thu Jan  8 16:32:00 2026] RPC: Registered udp transport module.
[Thu Jan  8 16:32:00 2026] RPC: Registered tcp transport module.
[Thu Jan  8 16:32:00 2026] RPC: Registered tcp-with-tls transport module.
[Thu Jan  8 16:32:00 2026] RPC: Registered tcp NFSv4.1 backchannel transport module.
[Thu Jan  8 16:32:00 2026] PCI: CLS 0 bytes, default 64
[Thu Jan  8 16:32:00 2026] Trying to unpack rootfs image as initramfs...
[Thu Jan  8 16:32:00 2026] kvm [1]: nv: 554 coarse grained trap handlers
[Thu Jan  8 16:32:00 2026] kvm [1]: IPA Size Limit: 40 bits
[Thu Jan  8 16:32:00 2026] kvm [1]: Hyp nVHE mode initialized successfully
[Thu Jan  8 16:32:00 2026] Freeing initrd memory: 11648K
[Thu Jan  8 16:32:00 2026] Initialise system trusted keyrings
[Thu Jan  8 16:32:00 2026] workingset: timestamp_bits=42 max_order=18 bucket_order=0
[Thu Jan  8 16:32:00 2026] NFS: Registering the id_resolver key type
[Thu Jan  8 16:32:00 2026] Key type id_resolver registered
[Thu Jan  8 16:32:00 2026] Key type id_legacy registered
[Thu Jan  8 16:32:00 2026] nfs4filelayout_init: NFSv4 File Layout Driver Registering...
[Thu Jan  8 16:32:00 2026] nfs4flexfilelayout_init: NFSv4 Flexfile Layout Driver Registering...
[Thu Jan  8 16:32:00 2026] Key type asymmetric registered
[Thu Jan  8 16:32:00 2026] Asymmetric key parser 'x509' registered
[Thu Jan  8 16:32:00 2026] Block layer SCSI generic (bsg) driver version 0.4 loaded (major 247)
[Thu Jan  8 16:32:00 2026] io scheduler mq-deadline registered
[Thu Jan  8 16:32:00 2026] io scheduler kyber registered
[Thu Jan  8 16:32:00 2026] io scheduler bfq registered
[Thu Jan  8 16:32:00 2026] pinctrl-bcm2835 3f200000.gpio: GPIO_OUT persistence: yes
[Thu Jan  8 16:32:00 2026] ledtrig-cpu: registered to indicate activity on CPUs
[Thu Jan  8 16:32:00 2026] simple-framebuffer 3eaa9000.framebuffer: framebuffer at 0x3eaa9000, 0x151800 bytes
[Thu Jan  8 16:32:00 2026] simple-framebuffer 3eaa9000.framebuffer: format=a8r8g8b8, mode=720x480x32, linelength=2880
[Thu Jan  8 16:32:00 2026] Console: switching to colour frame buffer device 90x30
[Thu Jan  8 16:32:00 2026] simple-framebuffer 3eaa9000.framebuffer: fb0: simplefb registered!
[Thu Jan  8 16:32:00 2026] Serial: 8250/16550 driver, 1 ports, IRQ sharing enabled
[Thu Jan  8 16:32:00 2026] bcm2835-rng 3f104000.rng: hwrng registered
[Thu Jan  8 16:32:00 2026] vc-mem: phys_addr:0x00000000 mem_base=0x3ec00000 mem_size:0x40000000(1024 MiB)
[Thu Jan  8 16:32:00 2026] brd: module loaded
[Thu Jan  8 16:32:00 2026] loop: module loaded
[Thu Jan  8 16:32:00 2026] Loading iSCSI transport class v2.0-870.
[Thu Jan  8 16:32:00 2026] usbcore: registered new interface driver lan78xx
[Thu Jan  8 16:32:00 2026] usbcore: registered new interface driver smsc95xx
[Thu Jan  8 16:32:00 2026] dwc_otg: version 3.00a 10-AUG-2012 (platform bus)
[Thu Jan  8 16:32:01 2026] Core Release: 2.80a
[Thu Jan  8 16:32:01 2026] Setting default values for core params
[Thu Jan  8 16:32:01 2026] Finished setting default values for core params
[Thu Jan  8 16:32:01 2026] Using Buffer DMA mode
[Thu Jan  8 16:32:01 2026] Periodic Transfer Interrupt Enhancement - disabled
[Thu Jan  8 16:32:01 2026] Multiprocessor Interrupt Enhancement - disabled
[Thu Jan  8 16:32:01 2026] OTG VER PARAM: 0, OTG VER FLAG: 0
[Thu Jan  8 16:32:01 2026] Dedicated Tx FIFOs mode
[Thu Jan  8 16:32:01 2026] INFO:: FIQ DMA bounce buffers: virt = ffffffc080ccb000 dma = 0x00000000de800000 len=9024
[Thu Jan  8 16:32:01 2026] FIQ FSM acceleration enabled for :
                           Non-periodic Split Transactions
                           Periodic Split Transactions
                           High-Speed Isochronous Endpoints
                           Interrupt/Control Split Transaction hack enabled
[Thu Jan  8 16:32:01 2026] dwc_otg: Microframe scheduler enabled
[Thu Jan  8 16:32:01 2026] INFO:: MPHI regs_base at ffffffc08006d000
[Thu Jan  8 16:32:01 2026] dwc_otg 3f980000.usb: DWC OTG Controller
[Thu Jan  8 16:32:01 2026] dwc_otg 3f980000.usb: new USB bus registered, assigned bus number 1
[Thu Jan  8 16:32:01 2026] dwc_otg 3f980000.usb: irq 74, io mem 0x00000000
[Thu Jan  8 16:32:01 2026] Init: Port Power? op_state=1
[Thu Jan  8 16:32:01 2026] Init: Power Port (0)
[Thu Jan  8 16:32:01 2026] usb usb1: New USB device found, idVendor=1d6b, idProduct=0002, bcdDevice= 6.12
[Thu Jan  8 16:32:01 2026] usb usb1: New USB device strings: Mfr=3, Product=2, SerialNumber=1
[Thu Jan  8 16:32:01 2026] usb usb1: Product: DWC OTG Controller
[Thu Jan  8 16:32:01 2026] usb usb1: Manufacturer: Linux 6.12.47+rpt-rpi-v8 dwc_otg_hcd
[Thu Jan  8 16:32:01 2026] usb usb1: SerialNumber: 3f980000.usb
[Thu Jan  8 16:32:01 2026] hub 1-0:1.0: USB hub found
[Thu Jan  8 16:32:01 2026] hub 1-0:1.0: 1 port detected
[Thu Jan  8 16:32:01 2026] dwc_otg: FIQ enabled
[Thu Jan  8 16:32:01 2026] dwc_otg: NAK holdoff enabled
[Thu Jan  8 16:32:01 2026] dwc_otg: FIQ split-transaction FSM enabled
[Thu Jan  8 16:32:01 2026] Module dwc_common_port init
[Thu Jan  8 16:32:01 2026] usbcore: registered new interface driver uas
[Thu Jan  8 16:32:01 2026] usbcore: registered new interface driver usb-storage
[Thu Jan  8 16:32:01 2026] mousedev: PS/2 mouse device common for all mice
[Thu Jan  8 16:32:01 2026] sdhci: Secure Digital Host Controller Interface driver
[Thu Jan  8 16:32:01 2026] sdhci: Copyright(c) Pierre Ossman
[Thu Jan  8 16:32:01 2026] sdhci-pltfm: SDHCI platform and OF driver helper
[Thu Jan  8 16:32:01 2026] hid: raw HID events driver (C) Jiri Kosina
[Thu Jan  8 16:32:01 2026] usbcore: registered new interface driver usbhid
[Thu Jan  8 16:32:01 2026] usbhid: USB HID core driver
[Thu Jan  8 16:32:01 2026] hw perfevents: enabled with armv8_cortex_a53 PMU driver, 7 (0,8000003f) counters available
[Thu Jan  8 16:32:01 2026] NET: Registered PF_PACKET protocol family
[Thu Jan  8 16:32:01 2026] Key type dns_resolver registered
[Thu Jan  8 16:32:01 2026] registered taskstats version 1
[Thu Jan  8 16:32:01 2026] Loading compiled-in X.509 certificates
[Thu Jan  8 16:32:01 2026] Demotion targets for Node 0: null
[Thu Jan  8 16:32:01 2026] Key type .fscrypt registered
[Thu Jan  8 16:32:01 2026] Key type fscrypt-provisioning registered
[Thu Jan  8 16:32:01 2026] bcm2835-wdt bcm2835-wdt: Broadcom BCM2835 watchdog timer
[Thu Jan  8 16:32:01 2026] bcm2835-power bcm2835-power: Broadcom BCM2835 power domains driver
[Thu Jan  8 16:32:01 2026] mmc-bcm2835 3f300000.mmcnr: mmc_debug:0 mmc_debug2:0
[Thu Jan  8 16:32:01 2026] mmc-bcm2835 3f300000.mmcnr: DMA channel allocated
[Thu Jan  8 16:32:01 2026] uart-pl011 3f201000.serial: there is not valid maps for state default
[Thu Jan  8 16:32:01 2026] uart-pl011 3f201000.serial: cts_event_workaround enabled
[Thu Jan  8 16:32:01 2026] 3f201000.serial: ttyAMA0 at MMIO 0x3f201000 (irq = 99, base_baud = 0) is a PL011 rev2
[Thu Jan  8 16:32:01 2026] of_cfs_init
[Thu Jan  8 16:32:01 2026] of_cfs_init: OK
[Thu Jan  8 16:32:01 2026] clk: Disabling unused clocks
[Thu Jan  8 16:32:01 2026] PM: genpd: Disabling unused power domains
[Thu Jan  8 16:32:01 2026] Indeed it is in host mode hprt0 = 00021501
[Thu Jan  8 16:32:02 2026] sdhost-bcm2835 3f202000.mmc: loaded - DMA enabled (>1)
[Thu Jan  8 16:32:02 2026] Freeing unused kernel memory: 5440K
[Thu Jan  8 16:32:02 2026] Run /init as init process
[Thu Jan  8 16:32:02 2026]   with arguments:
[Thu Jan  8 16:32:02 2026]     /init
[Thu Jan  8 16:32:02 2026]   with environment:
[Thu Jan  8 16:32:02 2026]     HOME=/
[Thu Jan  8 16:32:02 2026]     TERM=linux
[Thu Jan  8 16:32:02 2026] mmc1: new high speed SDIO card at address 0001
[Thu Jan  8 16:32:02 2026] mmc0: host does not support reading read-only switch, assuming write-enable
[Thu Jan  8 16:32:02 2026] mmc0: Problem switching card into high-speed mode!
[Thu Jan  8 16:32:02 2026] mmc0: new SDXC card at address 0001
[Thu Jan  8 16:32:02 2026] mmcblk0: mmc0:0001 USD 59.5 GiB
[Thu Jan  8 16:32:02 2026]  mmcblk0: p1 p2
[Thu Jan  8 16:32:02 2026] mmcblk0: mmc0:0001 USD 59.5 GiB
[Thu Jan  8 16:32:02 2026] usb 1-1: new high-speed USB device number 2 using dwc_otg
[Thu Jan  8 16:32:02 2026] Indeed it is in host mode hprt0 = 00001101
[Thu Jan  8 16:32:02 2026] usb 1-1: New USB device found, idVendor=0424, idProduct=2514, bcdDevice= b.b3
[Thu Jan  8 16:32:02 2026] usb 1-1: New USB device strings: Mfr=0, Product=0, SerialNumber=0
[Thu Jan  8 16:32:02 2026] hub 1-1:1.0: USB hub found
[Thu Jan  8 16:32:02 2026] hub 1-1:1.0: 4 ports detected
[Thu Jan  8 16:32:02 2026] usb 1-1.1: new high-speed USB device number 3 using dwc_otg
[Thu Jan  8 16:32:02 2026] usb 1-1.1: New USB device found, idVendor=0424, idProduct=2514, bcdDevice= b.b3
[Thu Jan  8 16:32:02 2026] usb 1-1.1: New USB device strings: Mfr=0, Product=0, SerialNumber=0
[Thu Jan  8 16:32:02 2026] hub 1-1.1:1.0: USB hub found
[Thu Jan  8 16:32:02 2026] hub 1-1.1:1.0: 3 ports detected
[Thu Jan  8 16:32:03 2026] dwc_otg_handle_wakeup_detected_intr lxstate = 2
[Thu Jan  8 16:32:03 2026] usb 1-1.1.1: new high-speed USB device number 4 using dwc_otg
[Thu Jan  8 16:32:03 2026] usb 1-1.1.1: New USB device found, idVendor=0424, idProduct=7800, bcdDevice= 3.00
[Thu Jan  8 16:32:03 2026] usb 1-1.1.1: New USB device strings: Mfr=0, Product=0, SerialNumber=0
[Thu Jan  8 16:32:03 2026] lan78xx 1-1.1.1:1.0 (unnamed net_device) (uninitialized): No External EEPROM. Setting MAC Speed
[Thu Jan  8 16:32:04 2026] lan78xx 1-1.1.1:1.0 (unnamed net_device) (uninitialized): int urb period 64
[Thu Jan  8 16:32:13 2026] EXT4-fs (mmcblk0p2): orphan cleanup on readonly fs
[Thu Jan  8 16:32:13 2026] EXT4-fs (mmcblk0p2): mounted filesystem 7c32fc47-9afe-48a1-8b32-00cf57bc60de ro with ordered data mode. Quota mode: none.
[Thu Jan  8 16:32:14 2026] systemd[1]: System time before build time, advancing clock.
[Thu Jan  8 16:32:15 2026] NET: Registered PF_INET6 protocol family
[Thu Jan  8 16:32:15 2026] Segment Routing with IPv6
[Thu Jan  8 16:32:15 2026] In-situ OAM (IOAM) with IPv6
[Thu Jan  8 16:32:15 2026] systemd[1]: systemd 252.39-1~deb12u1 running in system mode (+PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP +GCRYPT -GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 -PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD -BPF_FRAMEWORK -XKBCOMMON +UTMP +SYSVINIT default-hierarchy=unified)
[Thu Jan  8 16:32:15 2026] systemd[1]: Detected architecture arm64.
[Thu Jan  8 16:32:15 2026] systemd[1]: Hostname set to <mainsailos>.
[Thu Jan  8 16:32:16 2026] systemd[1]: Queued start job for default target multi-user.target.
[Thu Jan  8 16:32:16 2026] systemd[1]: Created slice system-getty.slice - Slice /system/getty.
[Thu Jan  8 16:32:16 2026] systemd[1]: Created slice system-modprobe.slice - Slice /system/modprobe.
[Thu Jan  8 16:32:16 2026] systemd[1]: Created slice system-systemd\\x2dfsck.slice - Slice /system/systemd-fsck.
[Thu Jan  8 16:32:16 2026] systemd[1]: Created slice user.slice - User and Session Slice.
[Thu Jan  8 16:32:16 2026] systemd[1]: Started systemd-ask-password-console.path - Dispatch Password Requests to Console Directory Watch.
[Thu Jan  8 16:32:16 2026] systemd[1]: Started systemd-ask-password-wall.path - Forward Password Requests to Wall Directory Watch.
[Thu Jan  8 16:32:16 2026] systemd[1]: Set up automount proc-sys-fs-binfmt_misc.automount - Arbitrary Executable File Formats File System Automount Point.
[Thu Jan  8 16:32:16 2026] systemd[1]: Expecting device dev-disk-by\\x2dpartuuid-a233995b\\x2d01.device - /dev/disk/by-partuuid/a233995b-01...
[Thu Jan  8 16:32:16 2026] systemd[1]: Reached target cryptsetup.target - Local Encrypted Volumes.
[Thu Jan  8 16:32:16 2026] systemd[1]: Reached target integritysetup.target - Local Integrity Protected Volumes.
[Thu Jan  8 16:32:16 2026] systemd[1]: Reached target paths.target - Path Units.
[Thu Jan  8 16:32:16 2026] systemd[1]: Reached target slices.target - Slice Units.
[Thu Jan  8 16:32:16 2026] systemd[1]: Reached target swap.target - Swaps.
[Thu Jan  8 16:32:16 2026] systemd[1]: Reached target veritysetup.target - Local Verity Protected Volumes.
[Thu Jan  8 16:32:16 2026] systemd[1]: Listening on systemd-fsckd.socket - fsck to fsckd communication Socket.
[Thu Jan  8 16:32:16 2026] systemd[1]: Listening on systemd-initctl.socket - initctl Compatibility Named Pipe.
[Thu Jan  8 16:32:16 2026] systemd[1]: Listening on systemd-journald-audit.socket - Journal Audit Socket.
[Thu Jan  8 16:32:16 2026] systemd[1]: Listening on systemd-journald-dev-log.socket - Journal Socket (/dev/log).
[Thu Jan  8 16:32:16 2026] systemd[1]: Listening on systemd-journald.socket - Journal Socket.
[Thu Jan  8 16:32:16 2026] systemd[1]: Listening on systemd-networkd.socket - Network Service Netlink Socket.
[Thu Jan  8 16:32:16 2026] systemd[1]: Listening on systemd-udevd-control.socket - udev Control Socket.
[Thu Jan  8 16:32:16 2026] systemd[1]: Listening on systemd-udevd-kernel.socket - udev Kernel Socket.
[Thu Jan  8 16:32:16 2026] systemd[1]: dev-hugepages.mount - Huge Pages File System was skipped because of an unmet condition check (ConditionPathExists=/sys/kernel/mm/hugepages).
[Thu Jan  8 16:32:16 2026] systemd[1]: Mounting dev-mqueue.mount - POSIX Message Queue File System...
[Thu Jan  8 16:32:16 2026] systemd[1]: Mounting sys-kernel-debug.mount - Kernel Debug File System...
[Thu Jan  8 16:32:16 2026] systemd[1]: Mounting sys-kernel-tracing.mount - Kernel Trace File System...
[Thu Jan  8 16:32:16 2026] systemd[1]: auth-rpcgss-module.service - Kernel Module supporting RPCSEC_GSS was skipped because of an unmet condition check (ConditionPathExists=/etc/krb5.keytab).
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting fake-hwclock.service - Restore / save the current clock...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting keyboard-setup.service - Set the console keyboard layout...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting kmod-static-nodes.service - Create List of Static Device Nodes...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting modprobe@configfs.service - Load Kernel Module configfs...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting modprobe@dm_mod.service - Load Kernel Module dm_mod...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting modprobe@drm.service - Load Kernel Module drm...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting modprobe@efi_pstore.service - Load Kernel Module efi_pstore...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting modprobe@fuse.service - Load Kernel Module fuse...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting modprobe@loop.service - Load Kernel Module loop...
[Thu Jan  8 16:32:16 2026] systemd[1]: systemd-fsck-root.service - File System Check on Root Device was skipped because of an unmet condition check (ConditionPathExists=!/run/initramfs/fsck-root).
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting systemd-journald.service - Journal Service...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting systemd-modules-load.service - Load Kernel Modules...
[Thu Jan  8 16:32:16 2026] device-mapper: ioctl: 4.48.0-ioctl (2023-03-01) initialised: dm-devel@lists.linux.dev
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting systemd-network-generator.service - Generate network units from Kernel command line...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting systemd-remount-fs.service - Remount Root and Kernel File Systems...
[Thu Jan  8 16:32:16 2026] systemd[1]: Starting systemd-udev-trigger.service - Coldplug All udev Devices...
[Thu Jan  8 16:32:16 2026] systemd[1]: Mounted dev-mqueue.mount - POSIX Message Queue File System.
[Thu Jan  8 16:32:16 2026] systemd[1]: Mounted sys-kernel-debug.mount - Kernel Debug File System.
[Thu Jan  8 16:32:16 2026] systemd[1]: Mounted sys-kernel-tracing.mount - Kernel Trace File System.
[Thu Jan  8 16:32:16 2026] systemd[1]: Finished fake-hwclock.service - Restore / save the current clock.
[Thu Jan  8 16:32:16 2026] systemd[1]: Finished kmod-static-nodes.service - Create List of Static Device Nodes.
[Thu Jan  8 16:32:16 2026] systemd[1]: modprobe@configfs.service: Deactivated successfully.
[Thu Jan  8 16:32:16 2026] systemd[1]: Finished modprobe@configfs.service - Load Kernel Module configfs.
[Thu Jan  8 16:32:16 2026] fuse: init (API version 7.41)
[Thu Jan  8 16:32:16 2026] systemd[1]: modprobe@dm_mod.service: Deactivated successfully.
[Thu Jan  8 16:32:16 2026] systemd[1]: Finished modprobe@dm_mod.service - Load Kernel Module dm_mod.
[Thu Jan  8 16:32:16 2026] systemd[1]: modprobe@efi_pstore.service: Deactivated successfully.
[Thu Jan  8 16:32:16 2026] systemd[1]: Finished modprobe@efi_pstore.service - Load Kernel Module efi_pstore.
[Thu Jan  8 16:32:16 2026] systemd[1]: modprobe@fuse.service: Deactivated successfully.
[Thu Jan  8 16:32:16 2026] systemd[1]: Finished modprobe@fuse.service - Load Kernel Module fuse.
[Thu Jan  8 16:32:16 2026] systemd[1]: modprobe@loop.service: Deactivated successfully.
[Thu Jan  8 16:32:16 2026] systemd[1]: Finished modprobe@loop.service - Load Kernel Module loop.
[Thu Jan  8 16:32:16 2026] systemd[1]: Finished systemd-network-generator.service - Generate network units from Kernel command line.
[Thu Jan  8 16:32:16 2026] systemd[1]: Reached target network-pre.target - Preparation for Network.
[Thu Jan  8 16:32:16 2026] i2c_dev: i2c /dev entries driver
[Thu Jan  8 16:32:16 2026] systemd[1]: Mounting sys-fs-fuse-connections.mount - FUSE Control File System...
[Thu Jan  8 16:32:16 2026] EXT4-fs (mmcblk0p2): re-mounted 7c32fc47-9afe-48a1-8b32-00cf57bc60de r/w.
[Thu Jan  8 16:32:16 2026] systemd[1]: Mounting sys-kernel-config.mount - Kernel Configuration File System...
[Thu Jan  8 16:32:16 2026] systemd[1]: systemd-repart.service - Repartition Root Disk was skipped because no trigger condition checks were met.
[Thu Jan  8 16:32:16 2026] systemd[1]: Started systemd-journald.service - Journal Service.
[Thu Jan  8 16:32:16 2026] systemd-journald[250]: Received client request to flush runtime journal.
[Thu Jan  8 16:32:18 2026] cfg80211: Loading compiled-in X.509 certificates for regulatory database
[Thu Jan  8 16:32:18 2026] rpi-gpiomem 3f200000.gpiomem: window base 0x3f200000 size 0x00001000
[Thu Jan  8 16:32:18 2026] rpi-gpiomem 3f200000.gpiomem: initialised 1 regions as /dev/gpiomem
[Thu Jan  8 16:32:18 2026] Loaded X.509 cert 'benh@debian.org: 577e021cb980e0e820821ba7b54b4961b8b4fadf'
[Thu Jan  8 16:32:18 2026] Loaded X.509 cert 'romain.perier@gmail.com: 3abbc6ec146e09d1b6016ab9d6cf71dd233f0328'
[Thu Jan  8 16:32:18 2026] Loaded X.509 cert 'sforshee: 00b28ddf47aef9cea7'
[Thu Jan  8 16:32:18 2026] Loaded X.509 cert 'wens: 61c038651aabdcf94bd0ac7ff06c7248db18c600'
[Thu Jan  8 16:32:18 2026] snd_bcm2835: module is from the staging directory, the quality is unknown, you have been warned.
[Thu Jan  8 16:32:18 2026] bcm2835-audio bcm2835-audio: card created with 8 channels
[Thu Jan  8 16:32:18 2026] mc: Linux media interface: v0.10
[Thu Jan  8 16:32:18 2026] videodev: Linux video capture interface: v2.00
[Thu Jan  8 16:32:18 2026] vc_sm_cma: module is from the staging directory, the quality is unknown, you have been warned.
[Thu Jan  8 16:32:18 2026] bcm2835_vc_sm_cma_probe: Videocore shared memory driver
[Thu Jan  8 16:32:18 2026] [vc_sm_connected_init]: start
[Thu Jan  8 16:32:18 2026] [vc_sm_connected_init]: installed successfully
[Thu Jan  8 16:32:18 2026] bcm2835_mmal_vchiq: module is from the staging directory, the quality is unknown, you have been warned.
[Thu Jan  8 16:32:18 2026] bcm2835_v4l2: module is from the staging directory, the quality is unknown, you have been warned.
[Thu Jan  8 16:32:18 2026] bcm2835_isp: module is from the staging directory, the quality is unknown, you have been warned.
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Device node output[0] registered as /dev/video13
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Device node capture[0] registered as /dev/video14
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Device node capture[1] registered as /dev/video15
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Device node stats[2] registered as /dev/video16
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Register output node 0 with media controller
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Register capture node 1 with media controller
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Register capture node 2 with media controller
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Register capture node 3 with media controller
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Device node output[0] registered as /dev/video20
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Device node capture[0] registered as /dev/video21
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Device node capture[1] registered as /dev/video22
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Device node stats[2] registered as /dev/video23
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Register output node 0 with media controller
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Register capture node 1 with media controller
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Register capture node 2 with media controller
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Register capture node 3 with media controller
[Thu Jan  8 16:32:18 2026] bcm2835-isp bcm2835-isp: Loaded V4L2 bcm2835-isp
[Thu Jan  8 16:32:18 2026] bcm2835_codec: module is from the staging directory, the quality is unknown, you have been warned.
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Device registered as /dev/video10
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Loaded V4L2 decode
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Device registered as /dev/video11
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Loaded V4L2 encode
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Device registered as /dev/video12
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Loaded V4L2 isp
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Device registered as /dev/video18
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Loaded V4L2 image_fx
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Device registered as /dev/video31
[Thu Jan  8 16:32:18 2026] bcm2835-codec bcm2835-codec: Loaded V4L2 encode_image
[Thu Jan  8 16:32:18 2026] brcmfmac: F1 signature read @0x18000000=0x15264345
[Thu Jan  8 16:32:18 2026] brcmfmac: brcmf_fw_alloc_request: using brcm/brcmfmac43455-sdio for chip BCM4345/6
[Thu Jan  8 16:32:18 2026] usbcore: registered new interface driver brcmfmac
[Thu Jan  8 16:32:19 2026] brcmfmac: brcmf_c_process_txcap_blob: no txcap_blob available (err=-2)
[Thu Jan  8 16:32:19 2026] brcmfmac: brcmf_c_preinit_dcmds: Firmware: BCM4345/6 wl0: Aug 29 2023 01:47:08 version 7.45.265 (28bca26 CY) FWID 01-b677b91b
[Thu Jan  8 16:32:19 2026] Console: switching to colour dummy device 80x25
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: bound 3f400000.hvs (ops vc4_hvs_ops [vc4])
[Thu Jan  8 16:32:19 2026] Registered IR keymap rc-cec
[Thu Jan  8 16:32:19 2026] rc rc0: vc4-hdmi as /devices/platform/soc/3f902000.hdmi/rc/rc0
[Thu Jan  8 16:32:19 2026] input: vc4-hdmi as /devices/platform/soc/3f902000.hdmi/rc/rc0/input0
[Thu Jan  8 16:32:19 2026] input: vc4-hdmi HDMI Jack as /devices/platform/soc/3f902000.hdmi/sound/card1/input1
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: bound 3f902000.hdmi (ops vc4_hdmi_ops [vc4])
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: bound 3f004000.txp (ops vc4_txp_ops [vc4])
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: bound 3f206000.pixelvalve (ops vc4_crtc_ops [vc4])
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: bound 3f207000.pixelvalve (ops vc4_crtc_ops [vc4])
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: bound 3f807000.pixelvalve (ops vc4_crtc_ops [vc4])
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: bound 3fc00000.v3d (ops vc4_v3d_ops [vc4])
[Thu Jan  8 16:32:19 2026] [drm] Initialized vc4 0.0.0 for soc:gpu on minor 0
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: [drm] Cannot find any crtc or sizes
[Thu Jan  8 16:32:19 2026] vc4-drm soc:gpu: [drm] Cannot find any crtc or sizes
[Thu Jan  8 16:32:21 2026] Adding 524284k swap on /var/swap.  Priority:-2 extents:6 across:53755900k SS
[Thu Jan  8 16:32:24 2026] lan78xx 1-1.1.1:1.0 eth0: Link is Down
[Thu Jan  8 16:32:24 2026] brcmfmac: brcmf_cfg80211_set_power_mgmt: power save disabled
`,
    debug: `
lsb_release -a
Distributor ID:	Debian
Description:	Debian GNU/Linux 12 (bookworm)
Release:	12
Codename:	bookworm

uname -a
Linux mainsailos 6.12.47+rpt-rpi-v8 #1 SMP PREEMPT Debian 1:6.12.47-1+rpt1~bookworm (2025-09-16) aarch64 GNU/Linux

id
uid=1000(luis) gid=1000(luis) groups=1000(luis),4(adm),5(tty),20(dialout),24(cdrom),27(sudo),29(audio),44(video),46(plugdev),60(games),100(users),102(input),105(render),110(netdev),993(gpio),994(i2c),995(spi)

find /dev/serial
find: ‘/dev/serial’: No such file or directory

find /dev/v4l
/dev/v4l
/dev/v4l/by-path
/dev/v4l/by-path/platform-3f00b840.mailbox-video-index0
/dev/v4l/by-path/platform-3f00b840.mailbox-video-index3
/dev/v4l/by-path/platform-3f00b840.mailbox-video-index1
/dev/v4l/by-path/platform-3f00b840.mailbox-video-index2

free -h
               total        used        free      shared  buff/cache   available
Mem:           856Mi       215Mi       473Mi       4.0Mi       226Mi       641Mi
Swap:          511Mi          0B       511Mi

df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            292M     0  292M   0% /dev
tmpfs           172M  4.0M  168M   3% /run
/dev/mmcblk0p2   59G  7.3G   48G  14% /
tmpfs           429M  8.0K  429M   1% /dev/shm
tmpfs           5.0M   12K  5.0M   1% /run/lock
/dev/mmcblk0p1  510M   66M  445M  13% /boot/firmware
tmpfs            86M     0   86M   0% /run/user/1000

lsusb
Bus 001 Device 004: ID 0424:7800 Microchip Technology, Inc. (formerly SMSC) 
Bus 001 Device 003: ID 0424:2514 Microchip Technology, Inc. (formerly SMSC) USB 2.0 Hub
Bus 001 Device 002: ID 0424:2514 Microchip Technology, Inc. (formerly SMSC) USB 2.0 Hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub

systemctl status KlipperScreen
Unit KlipperScreen.service could not be found.

systemctl status klipper-mcu
Unit klipper-mcu.service could not be found.

ip --details --statistics link show dev can0
Device "can0" does not exist.

cat /boot/config.txt
DO NOT EDIT THIS FILE

The file you are looking for has moved to /boot/firmware/config.txt

cat /boot/firmware/config.txt
# For more options and information see
# http://rptl.io/configtxt
# Some settings may impact device functionality. See link above for details

# Uncomment some or all of these to enable the optional hardware interfaces
#dtparam=i2c_arm=on
#dtparam=i2s=on
#dtparam=spi=on

# Enable audio (loads snd_bcm2835)
dtparam=audio=on

# Additional overlays and parameters are documented
# /boot/firmware/overlays/README

# Automatically load overlays for detected cameras
camera_auto_detect=1

# Automatically load overlays for detected DSI displays
display_auto_detect=1

# Automatically load initramfs files, if found
auto_initramfs=1

# Enable DRM VC4 V3D driver
dtoverlay=vc4-kms-v3d
max_framebuffers=2

# Don't have the firmware create an initial video= setting in cmdline.txt.
# Use the kernel's default instead.
disable_fw_kms_setup=1

# Run in 64-bit mode
arm_64bit=1

# Disable compensation for displays with overscan
disable_overscan=1

# Run as fast as firmware / board allows
arm_boost=1

[cm4]
# Enable host mode on the 2711 built-in XHCI USB controller.
# This line should be removed if the legacy DWC2 controller is required
# (e.g. for USB device mode) or if USB support is not required.
otg_mode=1

[cm5]
dtoverlay=dwc2,dr_mode=host

[all]

####################################################
####     MainsailOS specific configurations     ####
####################################################
####      DO NOT CHANGE SECTION BELOW !!!       ####
####   UNLESS YOU KNOW WHAT YOU ARE DOING !!!   ####
####################################################

## For more options and information see
## https://www.raspberrypi.com/documentation/computers/config_txt.html
## Some settings may impact device functionality. See link above for details

## For additional information about device filters see
## https://www.raspberrypi.com/documentation/computers/config_txt.html#model-filters


[pi0]
## This affects Pi Zero(W) and Pi Zero2
## Due lag of RAM, limit GPU RAM
gpu_mem=128

[pi2]
gpu_mem=256

[pi3]
## Use 256 if 1Gb Ram Model!
gpu_mem=128
# gpu_mem=256

[pi4]
## Do not use more than 256Mb on Pi Model 4, it uses its own Management.
gpu_mem=256

[all]

## SPI Interface is enabled by default for Input Shaper
## This colides with Hyperpixel Display!
## Hyperpixel Screen uses the same Pin for Backlight.
dtparam=spi=on


## Enable Hardware UART for Serial Communication
## This also disables Bluetooth!
enable_uart=1
dtoverlay=disable-bt

## Enable I2C by default.
## This is used by Klipper's Host MCU
## See https://www.klipper3d.org/RPi_microcontroller.html#optional-enabling-i2c
## for destails.
## For MPU Accelrometer please use
## dtparam=i2c_arm=on,i2c_arm_baudrate=400000
dtparam=i2c_arm=on


### EXPERIMENTAL - Enable 64bit Kernel
### The 64-bit kernel will only work on:
### Raspberry Pi 3, 3+, 4, 400, Zero 2 W and 2B rev 1.2
### and Raspberry Pi Compute Modules 3, 3+ and 4.
# arm_64bit=1

####################################################

[all]

cat /boot/cmdline.txt
DO NOT EDIT THIS FILE

The file you are looking for has moved to /boot/firmware/cmdline.txt

cat /boot/armbianEnv.txt
cat: /boot/armbianEnv.txt: No such file or directory

cat /boot/orangepiEnv.txt
cat: /boot/orangepiEnv.txt: No such file or directory

cat /boot/BoardEnv.txt
cat: /boot/BoardEnv.txt: No such file or directory

cat /boot/env.txt
cat: /boot/env.txt: No such file or directory
`,
};