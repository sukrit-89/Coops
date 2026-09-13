import 'package:flutter/material.dart';

class BookingScreen extends StatefulWidget {
 const BookingScreen({super.key});

 @override
 State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
 final List<Map<String, dynamic>> _services = [
 {'id': 'electrical', 'name': 'Electrical Repair', 'price': 500},
 {'id': 'plumbing', 'name': 'Plumbing', 'price': 600},
 {'id': 'carpentry', 'name': 'Carpentry', 'price': 700},
 {'id': 'painting', 'name': 'Painting', 'price': 1200},
 ];
 String? _selectedService;
 DateTime? _selectedDate;
 TimeOfDay? _selectedTime;
 final _addressController = TextEditingController();
 final _requirementController = TextEditingController();
 bool _loading = false;

 Future<void> _pickDate() async {
 final picked = await showDatePicker(
 context: context,
 initialDate: DateTime.now(),
 firstDate: DateTime.now(),
 lastDate: DateTime.now().add(const Duration(days: 30)),
 );
 if (picked != null) setState(() => _selectedDate = picked);
 }

 Future<void> _pickTime() async {
 final picked = await showTimePicker(
 context: context,
 initialTime: const TimeOfDay(hour: 10, minute: 0),
 );
 if (picked != null) setState(() => _selectedTime = picked);
 }

 Future<void> _submit() async {
 if (_selectedService == null || _selectedDate == null || _selectedTime == null || _addressController.text.isEmpty) {
 ScaffoldMessenger.of(context).showSnackBar(
 const SnackBar(content: Text('Please fill in all fields')),
 );
 return;
 }

 setState(() => _loading = true);
 // TODO: POST /api/bookings
 await Future.delayed(const Duration(seconds: 1));
 setState(() => _loading = false);

 if (!mounted) return;
 ScaffoldMessenger.of(context).showSnackBar(
 const SnackBar(content: Text('Booking confirmed! Awaiting worker assignment.')),
 );
 }

 @override
 Widget build(BuildContext context) {
 return Scaffold(
 appBar: AppBar(title: const Text('New Booking')),
 body: ListView(
 padding: const EdgeInsets.all(16),
 children: [
 const Text('Service', style: TextStyle(fontWeight: FontWeight.bold)),
 const SizedBox(height: 8),
 ..._services.map((service) => RadioListTile<String>(
 title: Text(service['name']),
 subtitle: Text('₹${service['price']}'),
 value: service['id'],
 groupValue: _selectedService,
 onChanged: (value) => setState(() => _selectedService = value),
 )),
 const SizedBox(height: 16),
 const Text('Schedule', style: TextStyle(fontWeight: FontWeight.bold)),
 const SizedBox(height: 8),
 Row(
 children: [
 Expanded(
 child: OutlinedButton.icon(
 onPressed: _pickDate,
 icon: const Icon(Icons.calendar_today),
 label: Text(_selectedDate == null ? 'Select Date' : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'),
 ),
 ),
 const SizedBox(width: 12),
 Expanded(
 child: OutlinedButton.icon(
 onPressed: _pickTime,
 icon: const Icon(Icons.access_time),
 label: Text(_selectedTime == null ? 'Select Time' : _selectedTime!.format(context)),
 ),
 ),
 ],
 ),
 const SizedBox(height: 16),
 const Text('Address', style: TextStyle(fontWeight: FontWeight.bold)),
 const SizedBox(height: 8),
 TextField(
 controller: _addressController,
 decoration: const InputDecoration(
 hintText: 'House no, Street, Area',
 prefixIcon: Icon(Icons.location_on),
 ),
 ),
 const SizedBox(height: 16),
 const Text('Requirements (optional)', style: TextStyle(fontWeight: FontWeight.bold)),
 const SizedBox(height: 8),
 TextField(
 controller: _requirementController,
 maxLines: 3,
 decoration: const InputDecoration(
 hintText: 'Describe what needs to be done...',
 ),
 ),
 const SizedBox(height: 24),
 FilledButton(
 onPressed: _loading ? null : _submit,
 child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Confirm Booking'),
 ),
 ],
 ),
 );
 }
}
