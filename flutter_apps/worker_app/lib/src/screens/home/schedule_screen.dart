import 'package:flutter/material.dart';

class ScheduleScreen extends StatefulWidget {
 const ScheduleScreen({super.key});

 @override
 State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
 final List<Map<String, dynamic>> _slots = [
 {'day': 'Monday', 'start': '09:00', 'end': '17:00', 'active': true},
 {'day': 'Tuesday', 'start': '09:00', 'end': '17:00', 'active': true},
 {'day': 'Wednesday', 'start': '09:00', 'end': '17:00', 'active': true},
 {'day': 'Thursday', 'start': '09:00', 'end': '17:00', 'active': true},
 {'day': 'Friday', 'start': '09:00', 'end': '17:00', 'active': true},
 {'day': 'Saturday', 'start': '10:00', 'end': '14:00', 'active': false},
 {'day': 'Sunday', 'start': '10:00', 'end': '14:00', 'active': false},
 ];

 @override
 Widget build(BuildContext context) {
 return Scaffold(
 appBar: AppBar(title: const Text('My Schedule')),
 body: ListView.builder(
 padding: const EdgeInsets.all(16),
 itemCount: _slots.length,
 itemBuilder: (context, index) {
 final slot = _slots[index];
 return Card(
 margin: const EdgeInsets.only(bottom: 8),
 child: SwitchListTile(
 title: Text(slot['day'] as String),
 subtitle: Text('${slot['start']} - ${slot['end']}'),
 value: slot['active'] as bool,
 onChanged: (value) {
 setState(() { slot['active'] = value; });
 // TODO: Persist via API
 },
 secondary: Icon(slot['active'] as bool ? Icons.check_circle : Icons.cancel, color: slot['active'] as bool ? Colors.green : Colors.grey),
 ),
 );
 },
 ),
 floatingActionButton: FloatingActionButton.extended(
 onPressed: () {
 // TODO: Add new availability slot
 },
 label: const Text('Add Slot'),
 icon: const Icon(Icons.add),
 ),
 );
 }
}
