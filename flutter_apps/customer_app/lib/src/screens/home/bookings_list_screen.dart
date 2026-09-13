import 'package:flutter/material.dart';

class BookingsListScreen extends StatefulWidget {
 const BookingsListScreen({super.key});

 @override
 State<BookingsListScreen> createState() => _BookingsListScreenState();
}

class _BookingsListScreenState extends State<BookingsListScreen> {
 bool _loading = true;
 List<Map<String, dynamic>> _bookings = [];

 @override
 void initState() {
 super.initState();
 _loadBookings();
 }

 Future<void> _loadBookings() async {
 await Future.delayed(const Duration(milliseconds: 500));
 setState(() {
 _bookings = [
 {'id': '1', 'service': 'Electrical Repair', 'worker': 'Rajesh K.', 'scheduled': '2026-09-15 10:00', 'status': 'confirmed'},
 {'id': '2', 'service': 'Plumbing', 'worker': 'Priya S.', 'scheduled': '2026-09-16 14:00', 'status': 'pending'},
 ];
 _loading = false;
 });
 }

 Color _statusColor(String status) {
 switch (status) {
 case 'confirmed': return Colors.green;
 case 'in_progress': return Colors.orange;
 case 'completed': return Colors.blue;
 case 'pending': return Colors.grey;
 default: return Colors.grey;
 }
 }

 @override
 Widget build(BuildContext context) {
 return Scaffold(
 appBar: AppBar(title: const Text('My Bookings')),
 body: _loading
 ? const Center(child: CircularProgressIndicator())
 : _bookings.isEmpty
 ? const Center(child: Text('No bookings yet.'))
 : ListView.builder(
 padding: const EdgeInsets.all(16),
 itemCount: _bookings.length,
 itemBuilder: (context, index) {
 final booking = _bookings[index];
 return Card(
 margin: const EdgeInsets.only(bottom: 12),
 child: ListTile(
 title: Text(booking['service'] ?? 'Booking'),
 subtitle: Text('${booking['worker']} · ${booking['scheduled']}'),
 trailing: Chip(label: Text(booking['status'] ?? ''), backgroundColor: _statusColor(booking['status'] ?? '').withOpacity(0.2)),
 onTap: () {
 // TODO: Navigate to booking detail
 },
 ),
 );
 },
 ),
 floatingActionButton: FloatingActionButton(
 onPressed: () {
 // TODO: Navigate to new booking
 },
 child: const Icon(Icons.add),
 ),
 );
 }
}
