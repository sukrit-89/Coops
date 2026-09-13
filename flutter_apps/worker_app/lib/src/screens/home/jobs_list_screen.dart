import 'package:flutter/material.dart';

class JobsListScreen extends StatefulWidget {
 const JobsListScreen({super.key});

 @override
 State<JobsListScreen> createState() => _JobsListScreenState();
}

class _JobsListScreenState extends State<JobsListScreen> {
 bool _loading = true;
 List<Map<String, dynamic>> _jobs = [];

 @override
 void initState() {
 super.initState();
 _loadJobs();
 }

 Future<void> _loadJobs() async {
 // TODO: Fetch from /api/bookings via Supabase
 await Future.delayed(const Duration(milliseconds: 500));
 setState(() {
 _jobs = [
 {'id': '1', 'service': 'Electrical Repair', 'customer': 'Rajesh K.', 'address': '12, MG Road', 'scheduled': '2026-09-15 10:00', 'status': 'assigned'},
 {'id': '2', 'service': 'Plumbing', 'customer': 'Priya S.', 'address': '45, Park Street', 'scheduled': '2026-09-15 14:00', 'status': 'accepted'},
 ];
 _loading = false;
 });
 }

 Color _statusColor(String status) {
 switch (status) {
 case 'assigned': return Colors.blue;
 case 'accepted': return Colors.orange;
 case 'in_progress': return Colors.green;
 case 'completed': return Colors.grey;
 default: return Colors.grey;
 }
 }

 @override
 Widget build(BuildContext context) {
 return Scaffold(
 appBar: AppBar(title: const Text('My Jobs')),
 body: _loading
 ? const Center(child: CircularProgressIndicator())
 : _jobs.isEmpty
 ? const Center(child: Text('No jobs assigned yet.'))
 : ListView.builder(
 padding: const EdgeInsets.all(16),
 itemCount: _jobs.length,
 itemBuilder: (context, index) {
 final job = _jobs[index];
 return Card(
 margin: const EdgeInsets.only(bottom: 12),
 child: ListTile(
 title: Text(job['service'] ?? 'Job'),
 subtitle: Text('${job['customer']} · ${job['address']}\n${job['scheduled']}'),
 trailing: Chip(label: Text(job['status'] ?? ''), backgroundColor: _statusColor(job['status'] ?? '').withOpacity(0.2)),
 isThreeLine: true,
 onTap: () {
 // TODO: Navigate to job detail
 },
 ),
 );
 },
 ),
 floatingActionButton: FloatingActionButton.extended(
 onPressed: () {},
 label: const Text('Refresh'),
 icon: const Icon(Icons.refresh),
 ),
 );
 }
}
