import random
import math
import numpy as np
from sklearn.datasets import make_blobs
import os
os.chdir(os.path.dirname(__file__))


PATIENT_NUM = 60
TIMEPOINT_NUM = 10
STATUS_DIM = 8
STATUS_DIM_RANDOM = 2 # number of noise status dimensions
EVENT_DIM = 8
STATE_NUM = 5

treatment_types = ['treat_'+chr(65+i) for i in range(EVENT_DIM)]

timeline_points_mocker_filename = os.path.join(os.getcwd(), "mocker_timeline_specimen.txt" )
timeline_treatment_mocker_filename = os.path.join(os.getcwd(), "mocker_timeline_treatment.txt" )
sample_mocker_filename = os.path.join(os.getcwd(), "mocker_clinical_sample.txt")

patient_len_dict = {}

# mock treatment 
treatment_file = open(timeline_treatment_mocker_filename, 'w')
treatment_file.write('PATIENT_ID\tSTART_DATE\tSTOP_DATE\tEVENT_TYPE\tTREATMENT_TYPE\n')
for patient_idx in range(PATIENT_NUM):
    patient_id = 'patient_'+str(patient_idx)
    for treat in treatment_types:
        last_end = 0
        for _ in range(random.randint(0,2)):
            if last_end == TIMEPOINT_NUM-1:
                break
            start = random.randint(last_end, TIMEPOINT_NUM-2)
            stop = random.randint(start+1, TIMEPOINT_NUM-1)
            last_end = stop
            treatment_file.write(
                "{patient_id}\t{start}\t{stop}\tTREATMENT\t{type}\n".
                format(
                    patient_id=patient_id, start=start, stop=stop, type=treat
                )
            ) 
            patient_len_dict[patient_id] = stop
treatment_file.close()



# mock timepoints
points_file = open(timeline_points_mocker_filename, 'w')
points_file.write("PATIENT_ID\tSTART_DATE\tEVENT_TYPE\tSAMPLE_ID\n")

# mock samples of each timepoints
sample_file = open(sample_mocker_filename, 'w')

sample_header = [
    "#" + '\t'.join(['Patient_Identifier', 'Sample_Identifier'] + ['status_'+chr(i+65) for i in range(STATUS_DIM)]) +'\n',
    "#" + '\t'.join(['Patient_Identifier', 'Sample_Identifier'] + ['status_'+chr(i+65) for i in range(STATUS_DIM)]) +'\n',
    "#" + '\t'.join(['STRING', 'STRING'] + ['NUMBER' for _ in range(STATUS_DIM)]) +'\n',
    "#" + '\t'.join(['1' for _ in range(2 + STATUS_DIM)])+'\n',
    '\t'.join(['PATIENT_ID', 'SAMPLE_ID'] + ['status_'+chr(i+65) for i in range(STATUS_DIM)]) +'\n',
]

sample_file.writelines(sample_header)


sample_num = sum(patient_len_dict.values())
X, y = make_blobs(n_samples=sample_num, centers=STATE_NUM, n_features=STATUS_DIM-STATUS_DIM_RANDOM)

# sample time distribution (linear mocker)
def GET_STATE_RANGE(left_min=0, left_max=TIMEPOINT_NUM, right_min=0, right_max=STATE_NUM): 
    # Figure out how 'wide' each range is  
    leftSpan = left_max - left_min   
    rightSpan = right_max - right_min 

    # Compute the scale factor between left and right values 
    scaleFactor = float(rightSpan) / float(leftSpan) 

    # create interpolation function using pre-calculated scaleFactor
    def get_state_range(value):
        state_estimate = math.floor(right_min + (value-left_min)*scaleFactor)
        return [
            state_estimate, 
            min(STATE_NUM-1, state_estimate+1)
            ]

    return get_state_range

get_state_range = GET_STATE_RANGE()


sample_idx = 0
for patient_idx in range(PATIENT_NUM):
    patient_id = 'patient_'+str(patient_idx)
    for time_idx in range(patient_len_dict[patient_id]):
        sample_id = 'sample_'+str(sample_idx)
        points_file.write(
                "{patient_id}\t{start}\tSPECIMEN\t{sample_id}\n".
                format(
                    patient_id=patient_id, start=time_idx, sample_id = sample_id
                )
            ) 
        flag = 0

        while not get_state_range(time_idx)[0]<= y[flag] <= get_state_range(time_idx)[1]:
            if flag<len(X)-1: 
                flag += 1
            else:
                break

        
        suit_sample = X[flag]
        X = np.delete(X, flag, 0) 
        y = np.delete(y, flag, 0)
        sample_status = [str(i) for i in suit_sample] + [str(random.uniform(-12,12)) for _ in range(STATUS_DIM_RANDOM)]
        sample_file.write(
            '{patient_id}\t{sample_id}\t{status}\n'.format(
                patient_id = patient_id, sample_id = sample_id, status = '\t'.join(sample_status)
            )
        )
        sample_idx += 1

points_file.close()
sample_file.close()


