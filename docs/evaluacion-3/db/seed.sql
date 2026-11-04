-- Synthetic seed. No real people, no real documents.
INSERT INTO app_user(subject, display_name, role, programme, permissions) VALUES
 ('stu-0001','Ana Synthetic','student','ENG','{}'),
 ('stu-0002','Bruno Synthetic','student','ENG','{}'),
 ('stu-0003','Carla Synthetic','student','BUS','{}'),
 ('stu-0004','Diego Synthetic (low GPA)','student','ENG','{}'),
 ('adv-01','Adviser One','adviser',NULL,'{}'),
 ('coord-01','Mobility Coordinator','coordinator',NULL,'{}'),
 ('coord-senior','Senior Coordinator (override)','coordinator',NULL,'{nomination.override}'),
 ('acad-eng','Academic Coordinator ENG','academic_coordinator','ENG','{}'),
 ('acad-bus','Academic Coordinator BUS','academic_coordinator','BUS','{}'),
 ('it-01','IT Services','it',NULL,'{}');

INSERT INTO opportunity(opportunity_id, destination, term) VALUES
 ('OPP-2027-01','Universidad de Chile - semester exchange','2027-S1'),
 ('OPP-2027-02','TU Munich - semester exchange','2027-S1'),
 ('OPP-2027-03','Aalto University - semester exchange','2027-S2');
INSERT INTO requirement_version(opportunity_id, version_no, min_gpa, min_credits, places, horizon_deadline, material_fingerprint) VALUES
 ('OPP-2027-01',1,3.00,60,1, current_date + 30,'seed'),
 ('OPP-2027-02',1,3.30,70,2, current_date + 30,'seed'),
 ('OPP-2027-03',1,3.00,60,1, current_date + 30,'seed');
INSERT INTO application_period(opportunity_id, period_no, opens_on, closes_on) VALUES
 ('OPP-2027-01',1,current_date - 5,current_date + 30),
 ('OPP-2027-02',1,current_date - 5,current_date + 30),
 ('OPP-2027-03',1,current_date - 5,current_date + 30);
INSERT INTO adviser_assignment(subject, opportunity_id) VALUES
 ('adv-01','OPP-2027-01'),('adv-01','OPP-2027-02'),('adv-01','OPP-2027-03');
