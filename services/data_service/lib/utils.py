import pandas as pd

def fill_nulls_with_mean(df):
    df = df.copy()
    for column in df.columns:
        if df[column].dtype in ['int64', 'float64']:
            mean_value = df[column].mean()
            if pd.notna(mean_value):
                df[column] = df[column].fillna(mean_value)
            else:
                df[column] = df[column].fillna(0)
        elif df[column].dtype == 'bool':
            df[column] = df[column].fillna(False)
        elif df[column].dtype == 'object':
            mode_value = df[column].mode()
            if len(mode_value) > 0:
                df[column] = df[column].fillna(mode_value[0])
            else:
                df[column] = df[column].fillna('Unknown')
    return df
